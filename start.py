#!/usr/bin/env python3
"""Profissional OS — Ambiente de desenvolvimento local.

Inicia Firestore Emulator, backend (Flask) e frontend (Next.js) juntos.
Pressione Ctrl+C para parar tudo.

Uso:
    python start.py          # inicia tudo
    python start.py --check  # verifica pré-requisitos
    python start.py --clean  # limpa cache .next antes de iniciar
"""
import os
import sys
import time
import signal
import socket
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend-next"
VENV_PYTHON = BACKEND / "venv" / "Scripts" / "python.exe"

FIRESTORE_PORT = 8080
BACKEND_PORT = 5000
FRONTEND_PORT = 3000

processes = []
_shutting_down = False


def log(msg):
    print(f"[start] {msg}", flush=True)


def get_python():
    """Retorna o executável Python do venv se existir, senão 'python'."""
    if VENV_PYTHON.exists():
        return str(VENV_PYTHON)
    return "python"


def port_in_use(port):
    """Verifica se a porta está em uso (TCP connect)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0


def kill_port(port):
    """Mata processos que estão escutando na porta (Windows)."""
    try:
        result = subprocess.run(
            f'netstat -ano | findstr ":{port}" | findstr "LISTENING"',
            shell=True, capture_output=True, text=True, timeout=5,
        )
        pids = set()
        for line in result.stdout.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5:
                pids.add(parts[-1])
        for pid in pids:
            subprocess.run(f"taskkill /PID {pid} /F /T",
                           shell=True, capture_output=True, timeout=5)
            log(f"  Processo PID {pid} na porta {port} finalizado")
        time.sleep(1)
    except Exception:
        pass


def http_ok(url, timeout=2):
    """Verifica se uma URL responde com HTTP 200 ou 4xx (servidor vivo)."""
    try:
        req = urllib.request.Request(url, method="GET")
        urllib.request.urlopen(req, timeout=timeout)
        return True
    except urllib.error.HTTPError:
        return True
    except Exception:
        return False


def wait_for(condition, timeout=30, interval=1, label=""):
    """Aguarda até que condition() retorne True ou timeout."""
    for i in range(timeout):
        if condition():
            log(f"{label} pronto")
            return True
        time.sleep(interval)
    log(f"AVISO: {label} nao respondeu apos {timeout}s")
    return False


def run(cmd, cwd, name):
    log(f"Iniciando {name}...")
    p = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )
    processes.append((p, name))
    return p


def stream_output(p, name):
    colors = {"Firestore": "32", "Backend": "36", "Frontend": "35"}
    color = colors.get(name, "0")
    prefix = f"\033[{color}m[{name}]\033[0m"
    try:
        for line in p.stdout:
            line = line.rstrip()
            if line:
                print(f"{prefix} {line}", flush=True)
    except Exception:
        pass


def check_prerequisites():
    log("Verificando pre-requisitos...")
    ok = True
    if not VENV_PYTHON.exists():
        log(f"  python venv: FALTANDO ({VENV_PYTHON})")
        ok = False
    else:
        log("  python venv: OK")
    if not (FRONTEND / "node_modules").exists():
        log("  node_modules: FALTANDO (cd frontend-next && npm install)")
        ok = False
    else:
        log("  node_modules: OK")
    if not (BACKEND / ".env").exists():
        log("  backend/.env: FALTANDO")
        ok = False
    else:
        log("  backend/.env: OK")
    try:
        subprocess.run("firebase --version", shell=True,
                       capture_output=True, check=True, timeout=5)
        log("  firebase CLI: OK")
    except Exception:
        log("  firebase CLI: FALTANDO (npm install -g firebase-tools)")
        ok = False
    return ok


def start_emulator():
    if port_in_use(FIRESTORE_PORT):
        log("Firestore Emulator ja esta rodando")
        return True
    run("firebase emulators:start --only firestore", ROOT, "Firestore")
    return wait_for(
        lambda: port_in_use(FIRESTORE_PORT),
        timeout=25, label="Firestore Emulator",
    )


def run_seed():
    log("Executando seed de dados de teste...")
    py = get_python()
    seed_py = BACKEND / "seed.py"
    result = subprocess.run(
        f'"{py}" "{seed_py}"',
        shell=True, cwd=str(BACKEND),
        capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=30,
    )
    if result.returncode == 0:
        log("Seed concluido")
        log("  Provider: teste@profissional-os.com / Teste123")
        log("  Client:   cliente@profissional-os.com / Cliente123")
    else:
        log("AVISO: Seed falhou (dados podem ja existir)")
        if result.stderr:
            log(f"  {result.stderr.strip()[:200]}")


def start_backend():
    if port_in_use(BACKEND_PORT):
        log("Backend ja esta rodando")
        return True
    py = get_python()
    run(f'"{py}" app.py', BACKEND, "Backend")
    return wait_for(
        lambda: http_ok(f"http://localhost:{BACKEND_PORT}/api/v1/health") or port_in_use(BACKEND_PORT),
        timeout=20, label="Backend",
    )


def start_frontend():
    if port_in_use(FRONTEND_PORT):
        log("Frontend ja esta rodando")
        return True
    run("npm run dev", FRONTEND, "Frontend")
    return wait_for(
        lambda: port_in_use(FRONTEND_PORT),
        timeout=40, label="Frontend",
    )


def cleanup(*_):
    global _shutting_down
    if _shutting_down:
        return
    _shutting_down = True
    log("")
    log("Parando todos os servicos...")

    for p, name in reversed(processes):
        try:
            if p.poll() is None:
                if sys.platform == "win32":
                    p.send_signal(signal.CTRL_BREAK_EVENT)
                p.terminate()
                try:
                    p.wait(timeout=5)
                except Exception:
                    p.kill()
                log(f"  {name} parado")
        except Exception:
            pass

    try:
        subprocess.run("firebase emulators:stop", shell=True,
                       capture_output=True, cwd=str(ROOT), timeout=5)
    except Exception:
        pass

    for port in [FIRESTORE_PORT, BACKEND_PORT, FRONTEND_PORT]:
        if port_in_use(port):
            kill_port(port)

    log("Tudo parado. Ate logo!")
    sys.exit(0)


def main():
    if "--check" in sys.argv:
        ok = check_prerequisites()
        sys.exit(0 if ok else 1)

    if not VENV_PYTHON.exists():
        log("AVISO: venv nao encontrado, usando python do sistema")

    if "--clean" in sys.argv:
        next_cache = FRONTEND / ".next"
        if next_cache.exists():
            log("Limpando cache .next...")
            import shutil
            shutil.rmtree(next_cache, ignore_errors=True)
            log("Cache .next removido")

    import threading

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    log("=" * 60)
    log("  Profissional OS - Ambiente de Desenvolvimento")
    log("=" * 60)
    log("")

    # 1. Firestore Emulator
    if not start_emulator():
        log("Erro: nao foi possivel iniciar o Firestore Emulator")
        log("Verifique: npm install -g firebase-tools")
        sys.exit(1)

    # 2. Seed de dados de teste
    run_seed()

    # 3. Backend
    if not start_backend():
        log("AVISO: Backend pode ainda estar inicializando")

    # 4. Frontend
    if not start_frontend():
        log("AVISO: Frontend pode ainda estar compilando")

    # Iniciar threads para stream de output
    for p, name in processes:
        t = threading.Thread(target=stream_output, args=(p, name), daemon=True)
        t.start()

    log("")
    log("=" * 60)
    log("  Ambiente pronto!")
    log("  Frontend:  http://localhost:3000")
    log("  Backend:   http://localhost:5000")
    log("  Firestore: http://localhost:8080 (UI: http://localhost:4000)")
    log("  Pressione Ctrl+C para parar tudo")
    log("=" * 60)
    log("")

    while True:
        for p, name in processes:
            if p.poll() is not None:
                log(f"{name} terminou (exit code {p.returncode})")
                cleanup()
        time.sleep(2)


if __name__ == "__main__":
    main()

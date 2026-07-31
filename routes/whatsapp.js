const express = require('express');
const db = require('../db/database');
const cron = require('node-cron');
const https = require('https');

const router = express.Router();

let cronTask = null;

// ============ CONFIG ============

function getConfig() {
  const rows = db.getAll('whatsapp_config');
  return rows[0] || {
    api_key: '',
    phone_numbers: '',
    schedule_time: '08:00',
    enabled: false,
  };
}

function saveConfig(cfg) {
  const existing = db.getAll('whatsapp_config');
  if (existing.length > 0) {
    db.update('whatsapp_config', existing[0].id, {
      api_key: cfg.api_key || '',
      phone_numbers: cfg.phone_numbers || '',
      schedule_time: cfg.schedule_time || '08:00',
      enabled: cfg.enabled !== undefined ? cfg.enabled : false,
    });
  } else {
    db.insert('whatsapp_config', {
      api_key: cfg.api_key || '',
      phone_numbers: cfg.phone_numbers || '',
      schedule_time: cfg.schedule_time || '08:00',
      enabled: cfg.enabled !== undefined ? cfg.enabled : false,
    });
  }
}

router.get('/config', (req, res) => {
  res.json(getConfig());
});

router.put('/config', (req, res) => {
  const { api_key, phone_numbers, schedule_time, enabled } = req.body;
  saveConfig({ api_key, phone_numbers, schedule_time, enabled });
  rescheduleCron();
  res.json({ success: true });
});

// ============ MESSAGE GENERATION ============

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMOTask(task) {
  const team = normalizeTeamName(task?.responsible_team);
  if (!team) return true;
  return team === 'mo' || team === 'mos' || team === "mo's" || team.includes('mestre de obra');
}

const STATUS_EMOJI = {
  pendente: '⭕',
  em_andamento: '🔄',
  concluido: '✅',
};

const PRIORITY_EMOJI = {
  alta: '🔴',
  media: '🟡',
  baixa: '⚪',
};

function generateChecklistMessage() {
  const tasks = db.getAll('tasks');
  const teams = db.getAll('teams');
  const members = db.getAll('team_members');

  // Find MO team members
  const moTeam = teams.find(t => normalizeTeamName(t.name).includes('mestre de obra'));
  const moMembers = moTeam
    ? members.filter(m => Number(m.team_id) === Number(moTeam.id))
    : [];

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  let msg = `*📋 CHECKLIST DIÁRIO - COMPROMISSO TRIN*\n`;
  msg += `📅 ${dateStr}\n`;
  msg += `${'─'.repeat(30)}\n\n`;

  // Pre-Encontro tasks
  const preTasks = tasks.filter(t => (t.phase || 'pre') === 'pre');
  const duringTasks = tasks.filter(t => t.phase === 'during');

  // MO tasks (general responsibilities)
  const moPre = preTasks.filter(isMOTask);
  const moDuring = duringTasks.filter(isMOTask);

  // Team-specific tasks
  const teamPre = preTasks.filter(t => !isMOTask(t));
  const teamDuring = duringTasks.filter(t => !isMOTask(t));

  // Summary
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'concluido').length;
  const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
  const inProgressTasks = tasks.filter(t => t.status === 'em_andamento').length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  msg += `*📊 RESUMO GERAL*\n`;
  msg += `✅ Concluídas: ${doneTasks}/${totalTasks} (${pct}%)\n`;
  msg += `🔄 Em andamento: ${inProgressTasks}\n`;
  msg += `⭕ Pendentes: ${pendingTasks}\n\n`;

  // MO Pre-Encontro tasks
  if (moPre.length > 0) {
    const moPending = moPre.filter(t => t.status !== 'concluido');
    const moDone = moPre.filter(t => t.status === 'concluido').length;
    msg += `${'─'.repeat(30)}\n`;
    msg += `*👷 RESPONSABILIDADES GERAIS (MO's)*\n`;
    msg += `📋 Pré-Encontro: ${moDone}/${moPre.length} concluídas\n\n`;

    if (moPending.length > 0) {
      // Group by category
      const categories = {};
      for (const t of moPending) {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t);
      }
      for (const [cat, items] of Object.entries(categories)) {
        msg += `*📁 ${cat}*\n`;
        for (const t of items) {
          const status = STATUS_EMOJI[t.status] || '⭕';
          const priority = PRIORITY_EMOJI[t.priority] || '';
          const deadline = t.deadline ? ` | ⏰ ${t.deadline}` : '';
          msg += `${status} ${priority} [${t.item_number}] ${t.title}${deadline}\n`;
        }
        msg += `\n`;
      }
    } else {
      msg += `✅ Todas as tarefas de MO's do Pré-Encontro concluídas!\n\n`;
    }
  }

  // MO During-Encontro tasks
  if (moDuring.length > 0) {
    const moDuringPending = moDuring.filter(t => t.status !== 'concluido');
    const moDuringDone = moDuring.filter(t => t.status === 'concluido').length;
    msg += `*🏗️ DURANTE O ENCONTRO (MO's)*\n`;
    msg += `📋 ${moDuringDone}/${moDuring.length} concluídas\n\n`;

    if (moDuringPending.length > 0) {
      const categories = {};
      for (const t of moDuringPending) {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t);
      }
      for (const [cat, items] of Object.entries(categories)) {
        msg += `*📁 ${cat}*\n`;
        for (const t of items) {
          const status = STATUS_EMOJI[t.status] || '⭕';
          const priority = PRIORITY_EMOJI[t.priority] || '';
          msg += `${status} ${priority} [${t.item_number}] ${t.title}\n`;
        }
        msg += `\n`;
      }
    } else {
      msg += `✅ Todas as tarefas de MO's do Durante-Encontro concluídas!\n\n`;
    }
  }

  // Team-specific tasks summary
  if (teamPre.length > 0 || teamDuring.length > 0) {
    msg += `${'─'.repeat(30)}\n`;
    msg += `*👥 TAREFAS POR EQUIPE*\n\n`;

    const teamNames = [...new Set([
      ...teamPre.map(t => t.responsible_team),
      ...teamDuring.map(t => t.responsible_team),
    ])].filter(Boolean).sort();

    for (const teamName of teamNames) {
      const tPre = teamPre.filter(t => t.responsible_team === teamName);
      const tDuring = teamDuring.filter(t => t.responsible_team === teamName);
      const all = [...tPre, ...tDuring];
      const done = all.filter(t => t.status === 'concluido').length;
      const pending = all.filter(t => t.status !== 'concluido').length;
      msg += `*${teamName}*: ${done}/${all.length} ✅ | ${pending} pendentes\n`;
    }
    msg += `\n`;
  }

  // MO members contact info
  if (moMembers.length > 0) {
    msg += `${'─'.repeat(30)}\n`;
    msg += `*👷 MESTRES DE OBRAS*\n`;
    for (const m of moMembers) {
      const role = m.role ? ` (${m.role})` : '';
      const phone = m.phone ? ` 📞 ${m.phone}` : '';
      msg += `• ${m.name}${role}${phone}\n`;
    }
    msg += `\n`;
  }

  msg += `${'─'.repeat(30)}\n`;
  msg += `_Mensagem automática do Sistema Meu Coordenador_\n`;
  msg += `_Projeto Compromisso Trin - JUMIRE_`;

  return msg;
}

// ============ CALLMEBOT SEND ============

function sendViaCallMeBot(phone, text, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve({ success: true, response: data });
        } else {
          reject(new Error(`CallMeBot API returned ${response.statusCode}: ${data}`));
        }
      });
    }).on('error', err => {
      reject(err);
    });
  });
}

// ============ API ENDPOINTS ============

router.get('/checklist-message', (req, res) => {
  try {
    const msg = generateChecklistMessage();
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-now', async (req, res) => {
  try {
    const config = getConfig();
    if (!config.api_key) {
      return res.status(400).json({ error: 'CallMeBot API key não configurada. Configure em Configurações.' });
    }
    const phones = (config.phone_numbers || '').split(',').map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) {
      return res.status(400).json({ error: 'Nenhum número de telefone configurado.' });
    }

    const msg = generateChecklistMessage();
    const results = [];

    for (const phone of phones) {
      try {
        const result = await sendViaCallMeBot(phone, msg, config.api_key);
        results.push({ phone, success: true });
      } catch (err) {
        results.push({ phone, success: false, error: err.message });
      }
    }

    const allSuccess = results.every(r => r.success);
    res.json({
      success: allSuccess,
      results,
      message: allSuccess ? 'Mensagens enviadas com sucesso!' : 'Algumas mensagens falharam.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CRON SCHEDULE ============

async function sendDailyChecklist() {
  const config = getConfig();
  if (!config.enabled) return;
  if (!config.api_key) return;

  const phones = (config.phone_numbers || '').split(',').map(p => p.trim()).filter(Boolean);
  if (phones.length === 0) return;

  console.log(`[WhatsApp] Enviando checklist diário para ${phones.length} número(s)...`);

  const msg = generateChecklistMessage();
  for (const phone of phones) {
    try {
      await sendViaCallMeBot(phone, msg, config.api_key);
      console.log(`[WhatsApp] ✓ Enviado para ${phone}`);
    } catch (err) {
      console.error(`[WhatsApp] ✗ Erro enviando para ${phone}: ${err.message}`);
    }
  }
}

function rescheduleCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }

  const config = getConfig();
  if (!config.enabled) {
    console.log('[WhatsApp] Envio automático desativado.');
    return;
  }

  const [hour, minute] = (config.schedule_time || '08:00').split(':');
  const cronExpr = `${minute || '0'} ${hour || '8'} * * *`;

  if (!cron.validate(cronExpr)) {
    console.error(`[WhatsApp] Expressão cron inválida: ${cronExpr}`);
    return;
  }

  cronTask = cron.schedule(cronExpr, () => {
    sendDailyChecklist();
  });

  console.log(`[WhatsApp] Cron agendado: ${cronExpr} (diário às ${config.schedule_time})`);
}

module.exports = { router, rescheduleCron };

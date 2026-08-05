# Prompt — Fase 5: Rede Social Comercial e Chat

> Pré-requisito: Fase 4 concluída e validada.
> **TDD obrigatório:** todos os testes devem ser escritos e validados (Red) antes de implementar qualquer funcionalidade (Green). Refatore mantendo os testes verdes.

```text
Implemente a Fase 5 do Profissional OS — Rede social comercial e chat em tempo real.

**Lembre-se: TDD é obrigatório.** Para cada funcionalidade abaixo, siga o ciclo Red → Green → Refactor. Escreva os testes primeiro, valide que falham, implemente o mínimo para passar, refatore e confirme que os testes continuam passando.

---

## Rede social comercial

Implementar:

- Feed vertical.
- Fotos e vídeos curtos.
- Stories e reels.
- Curtidas, comentários, compartilhamentos e salvamentos.
- Seguir profissional.
- Publicações patrocinadas com controle administrativo.
- Botão "Agendar" em publicações.
- Botão "Comprar" em publicações.
- Botão "Assinar plano" em publicações.

Implementar moderação, denúncias, limites de upload, antivírus e validação de conteúdo.

## Chat

Implementar:

- Conversa cliente/profissional e conversa com equipe.
- Mensagens em tempo real via WebSocket.
- Envio de fotos, vídeos, áudios, documentos e localização.
- Mensagens automáticas.
- Status de entrega e leitura.
- Bloqueio e denúncia.
- Retenção e exclusão conforme LGPD.

## Notificações

Implementar estrutura para:

- Push, SMS e e-mail.
- Lembretes, confirmações, cancelamentos e promoções.
- Avisos e alertas financeiros e de segurança.
- WhatsApp em fase futura.

O usuário deverá controlar:

- Canais habilitados.
- Tipos de notificação.
- Horário de silêncio.
- Preferências por tenant e por unidade.

---

## Testes obrigatórios desta fase

### Testes unitários

- Validação de conteúdo (limites, antivírus mock).
- Regras de moderação.
- Preferências de notificação.

### Testes de integração

- WebSocket para chat em tempo real.
- Firebase Cloud Messaging para push.
- Upload de mídia para Cloud Storage.

### Testes end-to-end

1. Prestador publica foto com botão "Agendar".
2. Cliente vê no feed, curte e compartilha.
3. Cliente clica em "Agendar" e completa agendamento.
4. Cliente inicia chat com prestador.
5. Prestador responde com foto.
6. Cliente recebe notificação push.
7. Cliente denuncia publicação.
8. Administrador modera e remove.

---

## Critérios de aceite

- Feed vertical com publicações contendo botões de ação.
- Chat em tempo real funcionando via WebSocket.
- Notificações push via FCM (ou adaptador mock).
- Moderação administrativa operacional.
- Upload de mídia validado.
- Retenção e exclusão de mensagens conforme LGPD.
- Testes principais passando.
```

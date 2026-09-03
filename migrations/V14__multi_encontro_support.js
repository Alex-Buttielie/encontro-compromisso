module.exports = {
  up(db) {
    const encounters = db.getAll('encounters');
    if (encounters.length > 0) {
      for (const enc of encounters) {
        const updates = {};
        if (enc.edition_number === undefined || enc.edition_number === null) {
          let num = 15;
          const m = (enc.name || '').match(/XV|XIV|XIII|XII|XI|X|V|I+/);
          if (/XV/i.test(enc.name)) num = 15;
          else if (enc.name) {
            const roman = enc.name.match(/\b([IVXLCDM]+)\b/);
            if (roman) {
              const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
              let val = 0; let prev = 0;
              for (let i = roman[1].length - 1; i >= 0; i--) { const cur = map[roman[1][i]]; if (cur < prev) val -= cur; else val += cur; prev = cur; }
              if (val > 0 && val < 100) num = val;
            }
          }
          updates.edition_number = num;
        }
        if (enc.year === undefined || enc.year === null) {
          if (enc.start_date) updates.year = parseInt(enc.start_date.slice(0, 4)) || 2026;
          else updates.year = 2026;
        }
        if (enc.edition === undefined || enc.edition === null) {
          const n = updates.edition_number !== undefined ? updates.edition_number : enc.edition_number;
          updates.edition = n ? String(n) : '1';
        }
        if (enc.is_active === undefined || enc.is_active === null) {
          updates.is_active = true;
        }
        if (enc.status === undefined || enc.status === null) updates.status = 'em_preparacao';
        if (Object.keys(updates).length > 0) db.update('encounters', enc.id, updates);
      }
      const actives = db.getAll('encounters').filter(e => e.is_active);
      if (actives.length > 1) {
        const last = actives[actives.length - 1];
        for (const e of actives) if (e.id !== last.id) db.update('encounters', e.id, { is_active: false });
      }
      console.log(`  [V14] Upgraded ${encounters.length} encounter(s) with edition/year/is_active`);
    } else {
      const id = db.insert('encounters', { name: 'I Compromisso Trin', edition: '1', edition_number: 1, year: 2026, start_date: null, end_date: null, location: null, theme: null, theme_song: null, status: 'em_preparacao', is_active: true });
      console.log(`  [V14] Created default encounter id=${id} (I/2026)`);
    }

    const active = (() => { const encs = db.getAll('encounters'); return encs.find(e => e.is_active) || encs[encs.length - 1] || null; })();
    if (!active) return;
    const aid = active.id;
    const tables = ['tasks', 'teams', 'team_members', 'schedule', 'participants', 'finance', 'lembrancinhas', 'escolinhas', 'alicerces', 'lembretes', 'padrinhos', 'fornecedores', 'avisos', 'finance_categories', 'finance_events', 'finance_budget', 'budget_items', 'donations', 'cardapio', 'finance_closings'];
    let totalPatched = 0;
    for (const t of tables) {
      const list = db.getAll(t);
      for (const r of list) {
        if (r.encounter_id === undefined || r.encounter_id === null) {
          db.update(t, r.id, { encounter_id: aid });
          totalPatched++;
        }
      }
    }
    if (totalPatched > 0) console.log(`  [V14] Patched ${totalPatched} records with encounter_id=${aid}`);
    console.log('[V14] Multi-encontro support complete.');
  }
};

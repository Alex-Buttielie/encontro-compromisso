const { SEED_MEMBERS } = require('./V7__seed_team_members');

module.exports = {
  up(db) {
    const existing = db.getAll('team_members');
    const teams = db.getAll('teams');
    const teamIds = new Set(teams.map(t => t.id));

    let added = 0;
    let fixed = 0;

    for (const m of SEED_MEMBERS) {
      if (!teamIds.has(Number(m.team_id))) continue;
      const already = existing.find(e =>
        Number(e.team_id) === Number(m.team_id) &&
        (e.name || '').trim().toLowerCase() === m.name.trim().toLowerCase()
      );
      if (!already) {
        db.prepare('INSERT INTO team_members (team_id, name, role, phone, email) VALUES (?,?,?,?,?)')
          .run(m.team_id, m.name, m.role, m.phone, m.email);
        added++;
      }
    }

    for (const t of teams) {
      const count = db.filter('team_members', { team_id: t.id }).length;
      if (t.members_count !== count) {
        db.update('teams', t.id, { members_count: count });
        fixed++;
      }
    }

    if (added > 0) {
      console.log(`  [V11] Added ${added} missing team_members.`);
    } else {
      console.log(`  [V11] No missing team_members found.`);
    }
    if (fixed > 0) {
      console.log(`  [V11] Fixed members_count for ${fixed} teams.`);
    }
  },
};

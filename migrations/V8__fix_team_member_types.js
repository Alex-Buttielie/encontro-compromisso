module.exports = {
  up(db) {
    const members = db.getAll('team_members');
    let fixed = 0;
    for (const m of members) {
      if (m.team_id !== undefined && typeof m.team_id !== 'number') {
        db.update('team_members', m.id, { team_id: Number(m.team_id) });
        fixed++;
      }
    }

    const teams = db.getAll('teams');
    for (const t of teams) {
      const count = members.filter(m => Number(m.team_id) === Number(t.id)).length;
      db.update('teams', t.id, { members_count: count });
    }

    if (fixed > 0) {
      console.log(`  [V8] Fixed ${fixed} team_members with string team_id.`);
    } else {
      console.log(`  [V8] All team_members already have numeric team_id. No fixes needed.`);
    }
  },
};

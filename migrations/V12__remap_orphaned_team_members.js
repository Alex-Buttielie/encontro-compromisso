const fs = require('fs');
const path = require('path');

module.exports = {
  up(db) {
    const teams = db.getAll('teams');
    const members = db.getAll('team_members');

    const orphaned = members.filter(m => !teams.find(t => t.id === m.team_id));
    if (orphaned.length === 0) {
      console.log(`  [V12] No orphaned team_members found. Skipping.`);
      return;
    }

    console.log(`  [V12] Found ${orphaned.length} orphaned team_members. Remapping team_id by team name...`);

    let v1Data;
    try {
      v1Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'V1_data.json'), 'utf-8'));
    } catch (e) {
      console.log(`  [V12] WARNING: V1_data.json not found, trying name-based matching from seed data.`);
      v1Data = null;
    }

    let oldIdToName = {};
    if (v1Data && v1Data.teams) {
      v1Data.teams.forEach(t => { oldIdToName[t.id] = t.name; });
    }

    const { SEED_MEMBERS } = require('./V7__seed_team_members');
    SEED_MEMBERS.forEach(m => {
      if (!oldIdToName[m.team_id]) oldIdToName[m.team_id] = null;
    });

    let remapped = 0;
    let unmatched = 0;

    for (const member of orphaned) {
      const oldTeamName = oldIdToName[member.team_id];

      if (oldTeamName) {
        const targetTeam = teams.find(t => t.name === oldTeamName);
        if (targetTeam) {
          db.update('team_members', member.id, { team_id: targetTeam.id });
          remapped++;
          continue;
        }
      }

      const seedMatch = SEED_MEMBERS.find(s =>
        Number(s.team_id) === Number(member.team_id) &&
        s.name.trim().toLowerCase() === (member.name || '').trim().toLowerCase()
      );
      if (seedMatch && oldIdToName[seedMatch.team_id]) {
        const targetTeam = teams.find(t => t.name === oldIdToName[seedMatch.team_id]);
        if (targetTeam) {
          db.update('team_members', member.id, { team_id: targetTeam.id });
          remapped++;
          continue;
        }
      }

      console.log(`  [V12] WARNING: Could not remap member "${member.name}" (team_id=${member.team_id})`);
      unmatched++;
    }

    for (const team of teams) {
      const count = db.filter('team_members', { team_id: team.id }).length;
      if (team.members_count !== count) {
        db.update('teams', team.id, { members_count: count });
      }
    }

    console.log(`  [V12] Remapped ${remapped} team_members. Unmatched: ${unmatched}.`);
  },
};

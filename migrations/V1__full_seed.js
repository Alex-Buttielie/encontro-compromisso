const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'V1_data.json');

module.exports = {
  up(db) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    const tables = [
      'tasks',
      'teams',
      'schedule',
      'encounters',
      'team_members',
      'participants',
      'finance',
      'lembrancinhas',
      'escolinhas',
      'alicerces',
      'fornecedores',
      'avisos',
      'lembretes',
      'padrinhos',
    ];

    const idRemap = {};

    let total = 0;
    for (const table of tables) {
      if (!data[table] || data[table].length === 0) continue;

      for (const record of data[table]) {
        const { id, _seq, ...clean } = record;
        const newId = db.insert(table, clean);
        if (id !== undefined && newId !== id) {
          if (!idRemap[table]) idRemap[table] = {};
          idRemap[table][id] = newId;
        }
        total++;
      }

      console.log(`  [V1] ${table}: ${data[table].length} records`);
    }

    if (idRemap.teams && data.team_members) {
      const teamNameMap = {};
      data.teams.forEach(t => { teamNameMap[t.id] = t.name; });
      const dbTeams = db.getAll('teams');
      const nameToNewId = {};
      dbTeams.forEach(t => { nameToNewId[t.name] = t.id; });

      let remapped = 0;
      for (const member of db.getAll('team_members')) {
        const oldTeamName = teamNameMap[member.team_id];
        if (oldTeamName && nameToNewId[oldTeamName] && nameToNewId[oldTeamName] !== member.team_id) {
          db.update('team_members', member.id, { team_id: nameToNewId[oldTeamName] });
          remapped++;
        }
      }
      if (remapped > 0) {
        console.log(`  [V1] Remapped ${remapped} team_members to new team IDs.`);
      }
    }

    console.log(`[V1] Full seed complete. ${total} records inserted.`);
  },
};

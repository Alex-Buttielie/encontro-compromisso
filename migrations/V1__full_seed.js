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

    let total = 0;
    for (const table of tables) {
      if (!data[table] || data[table].length === 0) continue;

      for (const record of data[table]) {
        const { id, _seq, ...clean } = record;
        db.insert(table, clean);
        total++;
      }

      console.log(`  [V1] ${table}: ${data[table].length} records`);
    }

    console.log(`[V1] Full seed complete. ${total} records inserted.`);
  },
};

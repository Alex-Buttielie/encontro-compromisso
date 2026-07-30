const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'V2_data.json');

module.exports = {
  up(db) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // Clear existing participants
    const existing = db.getAll('participants');
    for (const p of existing) {
      db.remove('participants', p.id);
    }
    console.log(`  [V2] Cleared ${existing.length} existing participants`);

    // Insert updated participants from PDF
    let inserted = 0;
    for (const p of data.participants) {
      const { id, created_at, updated_at, ...clean } = p;
      db.insert('participants', clean);
      inserted++;
    }

    console.log(`  [V2] Inserted ${inserted} updated participants`);
    console.log(`  [V2] Paid: ${data.participants.filter(p => p.paid).length}`);
    console.log('[V2] Participant sync complete.');
  },
};

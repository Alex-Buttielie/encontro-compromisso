const db = require('../db/database');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = __dirname;

function loadMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^V\d+__.*\.js$/.test(f))
    .sort((a, b) => {
      const va = parseInt(a.match(/^V(\d+)/)[1]);
      const vb = parseInt(b.match(/^V(\d+)/)[1]);
      return va - vb;
    });

  return files.map(f => {
    const match = f.match(/^V(\d+)__(.+)\.js$/);
    const migration = require(path.join(MIGRATIONS_DIR, f));
    return {
      version: parseInt(match[1]),
      description: match[2],
      filename: f,
      up: migration.up,
    };
  });
}

function getAppliedMigrations() {
  return db.getAll('migrations');
}

function isBaselineNeeded(applied, migrations) {
  if (applied.length > 0) return false;
  if (migrations.length === 0) return false;

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  return taskCount.count > 0;
}

function runMigrations() {
  const migrations = loadMigrations();

  if (migrations.length === 0) {
    console.log('No migrations found.');
    return;
  }

  const applied = getAppliedMigrations();
  const appliedVersions = new Set(applied.map(m => m.version));

  if (isBaselineNeeded(applied, migrations)) {
    const v1 = migrations[0];
    console.log(`[Migrations] Baseline detected: existing data found, marking V${v1.version} as applied.`);
    db.insert('migrations', {
      version: v1.version,
      description: v1.description + ' (baseline)',
      filename: v1.filename,
      applied_at: new Date().toISOString(),
    });
    appliedVersions.add(v1.version);
  }

  const pending = migrations.filter(m => !appliedVersions.has(m.version));

  if (pending.length === 0) {
    console.log(`[Migrations] All ${migrations.length} migrations already applied.`);
    return;
  }

  console.log(`[Migrations] ${pending.length} pending migration(s) of ${migrations.length} total.`);

  for (const migration of pending) {
    console.log(`[Migrations] Running V${migration.version}__${migration.description}...`);
    try {
      migration.up(db);
      db.insert('migrations', {
        version: migration.version,
        description: migration.description,
        filename: migration.filename,
        applied_at: new Date().toISOString(),
      });
      console.log(`[Migrations] V${migration.version} applied successfully.`);
    } catch (err) {
      console.error(`[Migrations] V${migration.version} FAILED: ${err.message}`);
      throw err;
    }
  }

  console.log(`[Migrations] All pending migrations applied.`);
}

module.exports = { runMigrations };

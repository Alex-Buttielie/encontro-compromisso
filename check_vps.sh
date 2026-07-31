#!/bin/bash
export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
echo "=== PROD DB ==="
cd /home/apps/coordenador-prod && node -e 'const db=require("./db/database");const t=db.getAll("teams");const m=db.getAll("team_members");const mig=db.getAll("migrations");console.log("teams:"+t.length,"members:"+m.length,"migrations:"+mig.length);const orphaned=m.filter(x=>!t.find(y=>y.id===x.team_id));console.log("orphaned:"+orphaned.length);t.slice(0,5).forEach(team=>{const tm=m.filter(x=>Number(x.team_id)===Number(team.id));console.log("  "+team.name+": "+tm.length+" members")})'
echo ""
echo "=== DEV DB ==="
cd /home/apps/coordenador-dev && node -e 'const db=require("./db/database");const t=db.getAll("teams");const m=db.getAll("team_members");const mig=db.getAll("migrations");console.log("teams:"+t.length,"members:"+m.length,"migrations:"+mig.length);const orphaned=m.filter(x=>!t.find(y=>y.id===x.team_id));console.log("orphaned:"+orphaned.length);t.slice(0,5).forEach(team=>{const tm=m.filter(x=>Number(x.team_id)===Number(team.id));console.log("  "+team.name+": "+tm.length+" members")})'
echo ""
echo "=== HOMOLOG DB ==="
cd /home/apps/coordenador-homolog && node -e 'const db=require("./db/database");const t=db.getAll("teams");const m=db.getAll("team_members");const mig=db.getAll("migrations");console.log("teams:"+t.length,"members:"+m.length,"migrations:"+mig.length);const orphaned=m.filter(x=>!t.find(y=>y.id===x.team_id));console.log("orphaned:"+orphaned.length);t.slice(0,5).forEach(team=>{const tm=m.filter(x=>Number(x.team_id)===Number(team.id));console.log("  "+team.name+": "+tm.length+" members")})'
echo ""
echo "=== MIGRATIONS PROD ==="
cd /home/apps/coordenador-prod && node -e 'const db=require("./db/database");db.getAll("migrations").forEach(m=>console.log("V"+m.version+"__"+m.description))'
echo "=== MIGRATIONS DEV ==="
cd /home/apps/coordenador-dev && node -e 'const db=require("./db/database");db.getAll("migrations").forEach(m=>console.log("V"+m.version+"__"+m.description))'
echo "=== MIGRATIONS HOMOLOG ==="
cd /home/apps/coordenador-homolog && node -e 'const db=require("./db/database");db.getAll("migrations").forEach(m=>console.log("V"+m.version+"__"+m.description))'

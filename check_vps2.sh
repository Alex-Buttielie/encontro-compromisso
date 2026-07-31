#!/bin/bash
export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
echo "=== PROD: Team IDs vs Member team_ids ==="
cd /home/apps/coordenador-prod && node -e '
const db=require("./db/database");
const t=db.getAll("teams");
const m=db.getAll("team_members");
console.log("Team IDs:", t.map(x=>x.id).join(","));
console.log("Member team_ids:", [...new Set(m.map(x=>x.team_id))].join(","));
console.log("Sample team:", JSON.stringify(t[0]));
console.log("Sample member:", JSON.stringify(m[0]));
console.log("Team id type:", typeof t[0].id);
console.log("Member team_id type:", typeof m[0].team_id);
console.log("Match test: team.id=1, members with team_id=1:", m.filter(x=>x.team_id===1).length);
console.log("Match test: team.id=1, members with team_id==1 (loose):", m.filter(x=>x.team_id==1).length);
console.log("Match test: Number(team_id)===Number(id):", m.filter(x=>Number(x.team_id)===Number(t[0].id)).length);
'

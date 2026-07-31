#!/bin/bash
export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
echo "=== PROD: Team name -> id mapping ==="
cd /home/apps/coordenador-prod && node -e '
const db=require("./db/database");
const t=db.getAll("teams");
const m=db.getAll("team_members");
t.forEach(team=>{
  console.log("id:"+team.id+" name:"+team.name+" members_count:"+team.members_count);
});
console.log("");
console.log("=== Members by team_id ===");
const byTeam={};
m.forEach(mem=>{
  if(!byTeam[mem.team_id]) byTeam[mem.team_id]=[];
  byTeam[mem.team_id].push(mem.name);
});
Object.keys(byTeam).sort((a,b)=>a-b).forEach(tid=>{
  console.log("team_id:"+tid+" -> "+byTeam[tid].length+" members: "+byTeam[tid].slice(0,3).join(", "));
});
'

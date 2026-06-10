import { db } from "../src/server/db";
import {
  users, teams, groupPredictions, knockoutPredictions, knockoutBracket,
  appSettings, actualGroupStandings, actualKnockoutResults,
} from "../src/server/db/schema";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

async function backup() {
  const [
    allUsers, allTeams, allGroupPredictions, allKnockoutPredictions,
    allKnockoutBracket, allAppSettings, allActualGroupStandings, allActualKnockoutResults,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(teams),
    db.select().from(groupPredictions),
    db.select().from(knockoutPredictions),
    db.select().from(knockoutBracket),
    db.select().from(appSettings),
    db.select().from(actualGroupStandings),
    db.select().from(actualKnockoutResults),
  ]);

  const snapshot = {
    takenAt: new Date().toISOString(),
    users: allUsers,
    teams: allTeams,
    groupPredictions: allGroupPredictions,
    knockoutPredictions: allKnockoutPredictions,
    knockoutBracket: allKnockoutBracket,
    appSettings: allAppSettings,
    actualGroupStandings: allActualGroupStandings,
    actualKnockoutResults: allActualKnockoutResults,
  };

  const date = new Date().toISOString().slice(0, 10);
  const dir = join(__dirname, "..", "db", "backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `predictions-backup-${date}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 2));

  console.log(`Backup written to ${file}`);
  console.log(`Users: ${allUsers.length}, group predictions: ${allGroupPredictions.length}, knockout predictions: ${allKnockoutPredictions.length}`);
}

backup().catch(console.error);

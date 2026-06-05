import { db } from "../src/server/db";
import { teams, groupPredictions, knockoutPredictions } from "../src/server/db/schema";
import { inArray } from "drizzle-orm";

async function cleanup() {
  const allTeams = await db.select().from(teams);
  console.log(`Total team rows in DB: ${allTeams.length}`);

  // Group IDs by name, keep the lowest (original), collect the rest as duplicates
  const byName = new Map<string, number[]>();
  for (const team of allTeams) {
    const ids = byName.get(team.name) ?? [];
    ids.push(team.id);
    byName.set(team.name, ids);
  }

  const duplicateIds: number[] = [];
  for (const [, ids] of byName.entries()) {
    if (ids.length > 1) {
      ids.sort((a, b) => a - b);
      duplicateIds.push(...ids.slice(1));
    }
  }

  if (duplicateIds.length === 0) {
    console.log("No duplicates found — nothing to do.");
    return;
  }

  console.log(`Found ${duplicateIds.length} duplicate team rows. Cleaning up...`);

  await db.delete(groupPredictions);
  console.log("Cleared group_predictions");

  await db.delete(knockoutPredictions);
  console.log("Cleared knockout_predictions");

  await db.delete(teams).where(inArray(teams.id, duplicateIds));
  console.log(`Deleted ${duplicateIds.length} duplicate teams`);

  const remaining = await db.select().from(teams);
  console.log(`Teams remaining: ${remaining.length}`);
  console.log("Done.");
}

cleanup().catch(console.error);

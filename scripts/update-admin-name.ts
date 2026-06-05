import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  await db.update(users).set({ name: "Ashwin" }).where(eq(users.email, "admin"));
  console.log("Done.");
}

run().catch(console.error);

import { db } from "./index";
import { users, teams, appSettings } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding...");

  const passwordHash = await bcrypt.hash("admn", 10);
  await db.insert(users).values({
    name: "Ashwin",
    email: "admin",
    passwordHash,
    role: "admin",
  }).onConflictDoNothing();

  await db.insert(teams).values([
    { name: "Mexico",           group: "A", flagCode: "mx" },
    { name: "South Africa",     group: "A", flagCode: "za" },
    { name: "South Korea",      group: "A", flagCode: "kr" },
    { name: "Czechia",          group: "A", flagCode: "cz" },

    { name: "Canada",           group: "B", flagCode: "ca" },
    { name: "Bosnia & Herz.",   group: "B", flagCode: "ba" },
    { name: "Qatar",            group: "B", flagCode: "qa" },
    { name: "Switzerland",      group: "B", flagCode: "ch" },

    { name: "Brazil",           group: "C", flagCode: "br" },
    { name: "Morocco",          group: "C", flagCode: "ma" },
    { name: "Haiti",            group: "C", flagCode: "ht" },
    { name: "Scotland",         group: "C", flagCode: "gb-sct" },

    { name: "United States",    group: "D", flagCode: "us" },
    { name: "Paraguay",         group: "D", flagCode: "py" },
    { name: "Australia",        group: "D", flagCode: "au" },
    { name: "Türkiye",          group: "D", flagCode: "tr" },

    { name: "Germany",          group: "E", flagCode: "de" },
    { name: "Curaçao",          group: "E", flagCode: "cw" },
    { name: "Ivory Coast",      group: "E", flagCode: "ci" },
    { name: "Ecuador",          group: "E", flagCode: "ec" },

    { name: "Netherlands",      group: "F", flagCode: "nl" },
    { name: "Japan",            group: "F", flagCode: "jp" },
    { name: "Sweden",           group: "F", flagCode: "se" },
    { name: "Tunisia",          group: "F", flagCode: "tn" },

    { name: "Belgium",          group: "G", flagCode: "be" },
    { name: "Egypt",            group: "G", flagCode: "eg" },
    { name: "Iran",             group: "G", flagCode: "ir" },
    { name: "New Zealand",      group: "G", flagCode: "nz" },

    { name: "Spain",            group: "H", flagCode: "es" },
    { name: "Cape Verde",       group: "H", flagCode: "cv" },
    { name: "Saudi Arabia",     group: "H", flagCode: "sa" },
    { name: "Uruguay",          group: "H", flagCode: "uy" },

    { name: "France",           group: "I", flagCode: "fr" },
    { name: "Senegal",          group: "I", flagCode: "sn" },
    { name: "Iraq",             group: "I", flagCode: "iq" },
    { name: "Norway",           group: "I", flagCode: "no" },

    { name: "Argentina",        group: "J", flagCode: "ar" },
    { name: "Algeria",          group: "J", flagCode: "dz" },
    { name: "Austria",          group: "J", flagCode: "at" },
    { name: "Jordan",           group: "J", flagCode: "jo" },

    { name: "Portugal",         group: "K", flagCode: "pt" },
    { name: "Congo DR",         group: "K", flagCode: "cd" },
    { name: "Uzbekistan",       group: "K", flagCode: "uz" },
    { name: "Colombia",         group: "K", flagCode: "co" },

    { name: "England",          group: "L", flagCode: "gb-eng" },
    { name: "Croatia",          group: "L", flagCode: "hr" },
    { name: "Ghana",            group: "L", flagCode: "gh" },
    { name: "Panama",           group: "L", flagCode: "pa" },
  ]).onConflictDoNothing();

  await db.insert(appSettings).values({ key: "knockout_enabled",    value: "false" }).onConflictDoNothing();
  await db.insert(appSettings).values({ key: "group_stage_locked",  value: "false" }).onConflictDoNothing();
  await db.insert(appSettings).values({ key: "knockout_locked",     value: "false" }).onConflictDoNothing();
  await db.insert(appSettings).values({ key: "predictions_visible", value: "false" }).onConflictDoNothing();

  console.log("Seed complete.");
}

seed().catch(console.error);

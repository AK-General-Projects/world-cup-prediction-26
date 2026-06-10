import { pgTable, text, integer, uuid, timestamp, unique } from "drizzle-orm/pg-core";

export const leagues = pgTable("leagues", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  leagueId: integer("league_id").references(() => leagues.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  group: text("group").notNull(),
  flagCode: text("flag_code").notNull(),
});

export const groupPredictions = pgTable("group_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  group: text("group").notNull(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  predictedPosition: integer("predicted_position").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.teamId)]);

export const knockoutPredictions = pgTable("knockout_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  round: text("round").notNull(),
  slot: integer("slot").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.round, t.slot)]);

export const knockoutBracket = pgTable("knockout_bracket", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchSlot: integer("match_slot").notNull().unique(), // 1–16
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const actualGroupStandings = pgTable("actual_group_standings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  group: text("group").notNull(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  position: integer("position").notNull(),
}, (t) => [
  unique().on(t.group, t.teamId),
  unique().on(t.group, t.position),
]);

export const actualKnockoutResults = pgTable("actual_knockout_results", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  round: text("round").notNull(),
  slot: integer("slot").notNull(),
  teamId: integer("team_id").references(() => teams.id),
}, (t) => [unique().on(t.round, t.slot)]);

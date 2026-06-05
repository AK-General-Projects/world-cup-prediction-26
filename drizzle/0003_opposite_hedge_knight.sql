CREATE TABLE "actual_group_standings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "actual_group_standings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"group" text NOT NULL,
	"team_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "actual_group_standings_group_team_id_unique" UNIQUE("group","team_id"),
	CONSTRAINT "actual_group_standings_group_position_unique" UNIQUE("group","position")
);
--> statement-breakpoint
CREATE TABLE "actual_knockout_results" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "actual_knockout_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"round" text NOT NULL,
	"slot" integer NOT NULL,
	"team_id" integer,
	CONSTRAINT "actual_knockout_results_round_slot_unique" UNIQUE("round","slot")
);
--> statement-breakpoint
ALTER TABLE "actual_group_standings" ADD CONSTRAINT "actual_group_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_knockout_results" ADD CONSTRAINT "actual_knockout_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
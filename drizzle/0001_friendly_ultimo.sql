CREATE TABLE "knockout_bracket" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "knockout_bracket_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"match_slot" integer NOT NULL,
	"team1_id" integer,
	"team2_id" integer,
	CONSTRAINT "knockout_bracket_match_slot_unique" UNIQUE("match_slot")
);
--> statement-breakpoint
ALTER TABLE "knockout_bracket" ADD CONSTRAINT "knockout_bracket_team1_id_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knockout_bracket" ADD CONSTRAINT "knockout_bracket_team2_id_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knockout_predictions" ADD CONSTRAINT "knockout_predictions_user_id_round_slot_unique" UNIQUE("user_id","round","slot");
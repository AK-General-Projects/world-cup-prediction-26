CREATE TABLE "leagues" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leagues_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "leagues_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "leagues" ("name") VALUES ('league1');--> statement-breakpoint
UPDATE "users" SET "league_id" = (SELECT "id" FROM "leagues" WHERE "name" = 'league1') WHERE "league_id" IS NULL;
CREATE UNIQUE INDEX "user_roles_one_role_per_user_unique" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_exactly_one_recipient_check" CHECK (
        (
          ("asset_assignments"."user_id" IS NOT NULL AND "asset_assignments"."assigned_to_department" IS NULL)
          OR
          (
            "asset_assignments"."user_id" IS NULL
            AND "asset_assignments"."assigned_to_department" IS NOT NULL
            AND btrim("asset_assignments"."assigned_to_department") <> ''
          )
        )
      );
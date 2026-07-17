# Disaster Recovery & Backup Verification

Covers backup, verification, restore, and migration rollback (Stage 5 §14 + improvements).

## Backups

- **Database (Neon):** automated daily backups + point-in-time recovery (PITR)
  are enabled at the Neon project level. Retention: 7 daily, 4 weekly.
- **Manual backups:** triggered from the admin (Settings → Backups) enqueue a
  Trigger.dev job that exports a logical dump to off-site object storage and
  records a `Backup` row (type=MANUAL, status transitions PENDING → COMPLETED).
- **Media (Cloudinary):** retained by the provider; a periodic job exports an
  asset manifest so media references can be reconciled after a restore.
- **Content history:** `ContentVersion` snapshots provide per-record rollback for
  Projects, Services, Industries, Posts, Legal documents, and Settings.

## Backup verification

A scheduled verification job runs after each backup:

1. Confirm the backup artifact exists and its size is non-zero.
2. Validate the stored checksum against a freshly computed one.
3. For periodic deep verification, restore into a disposable database and run
   `SELECT` sanity checks (row counts on core tables).
4. Update the `Backup` row (`status=VERIFIED`, `verifiedAt`). A failed
   verification raises a SECURITY/SYSTEM notification and an alert.

## Restore procedure

1. Put the app in maintenance mode (`MAINTENANCE_MODE=true`) so writes stop.
2. Restore the database from PITR (to a timestamp) or from a logical dump.
3. Reconcile media against the latest Cloudinary manifest; re-upload any missing
   assets from the dump if required.
4. Run `npm run prisma:migrate deploy` to ensure schema is at the expected version.
5. Smoke-test via `/api/v1/health` and the admin login.
6. Exit maintenance mode.

Targets: **RPO** ≤ 24h (daily) / near-zero with PITR; **RTO** ≤ 1h.

## Migration rollback

Prisma migrations are forward-only by default; rollback is handled deliberately:

1. **Before deploy:** every migration is reviewed and tested against a staging
   copy of production data.
2. **Backward-compatible changes** (additive columns/tables) are preferred so a
   rollback of application code does not require a DB rollback.
3. **If a migration must be reversed:** apply a new corrective "down" migration
   (hand-written) rather than mutating history, then redeploy. For destructive
   changes, restore from the pre-migration backup/PITR timestamp captured in the
   deploy pipeline.
4. The deploy pipeline captures a PITR marker immediately before running
   `migrate deploy`, giving a known-good restore point for every release.

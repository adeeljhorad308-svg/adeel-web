# Operations Runbook

## Monitoring

- **Health:** external monitor polls `/api/v1/health` (checks DB reachability).
- **Errors:** captured by the error boundaries and server logger; forwarded to the
  configured error-monitoring sink.
- **Traces:** OpenTelemetry exports to the configured OTLP endpoint when set.
- **Web Vitals / RUM:** collected in production for performance monitoring.
- **Security events:** failed-login spikes, role changes, and settings changes are
  written to the activity log and raise SECURITY notifications.

## Maintenance mode

Set `MAINTENANCE_MODE=true`. Middleware rewrites the public site to `/maintenance`
with a 503 + `Retry-After`, while `/admin` and auth routes remain reachable so
staff can keep working. Unset the flag to restore service.

## Background jobs (Trigger.dev)

- `send-email` — transactional email delivery with retries.
- `scheduled-publish-sweep` — cron (every minute), lock-protected; publishes due
  content (wired in Phase 3).
- Future: notifications fan-out, backups, exports, image optimization.

## Deployments

- CI (GitHub Actions) gates every PR: typecheck → lint → format → unit tests →
  build. Preview deploys per PR.
- `main` deploys to Vercel; `prisma migrate deploy` runs in the release step with
  a PITR marker captured immediately beforehand (see disaster-recovery.md).

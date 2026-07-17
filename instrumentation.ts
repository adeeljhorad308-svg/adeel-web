/**
 * Next.js instrumentation entry point.
 *
 * Runs once when the server process starts. We guard on the runtime so the OTel
 * Node SDK (which uses Node-only APIs) is loaded only in the Node.js runtime and
 * never in the Edge runtime, preventing bundling errors.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelemetry } = await import('@/lib/telemetry/otel');
    await startTelemetry();
  }
}

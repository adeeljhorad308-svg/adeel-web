import 'server-only';

/**
 * OpenTelemetry Node SDK initialization (Stage 5 improvement; §13).
 *
 * Loaded exclusively from instrumentation.ts in the Node.js runtime. Tracing is
 * enabled only when an OTLP endpoint is configured, so local development without
 * a collector incurs no overhead and no errors. Exporting is fire-and-forget;
 * telemetry must never affect request behavior.
 */

export async function startTelemetry(): Promise<void> {
  const { serverEnv } = await import('@/lib/config/env');

  if (!serverEnv.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return;
  }

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { Resource } = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

  const parseHeaders = (raw: string | undefined): Record<string, string> => {
    if (!raw) return {};
    return Object.fromEntries(
      raw
        .split(',')
        .map((pair) => pair.split('=').map((part) => part.trim()))
        .filter((entry): entry is [string, string] => entry.length === 2),
    );
  };

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serverEnv.OTEL_SERVICE_NAME,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${serverEnv.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      headers: parseHeaders(serverEnv.OTEL_EXPORTER_OTLP_HEADERS),
    }),
  });

  sdk.start();

  const shutdown = (): void => {
    void sdk.shutdown();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

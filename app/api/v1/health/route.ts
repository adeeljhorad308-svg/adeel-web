import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { success, toErrorEnvelope } from '@/lib/errors';
import { logger } from '@/lib/logging/logger';

/**
 * Health-check endpoint (Stage 5 §13, §19). Versioned under /api/v1 from the
 * start. Verifies database reachability so external monitors can detect outages.
 * Returns the standard response envelope.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      success({ status: 'ok', timestamp: new Date().toISOString() }),
      { status: 200 },
    );
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    const { body, status } = toErrorEnvelope(error);
    return NextResponse.json(body, { status });
  }
}

import { schedules } from '@trigger.dev/sdk/v3';
import { acquireLock } from '@/lib/cache/redis';
import { logger } from '@/lib/logging/logger';
import { publishDuePosts } from '@/lib/services/blog-service';

/**
 * Scheduled publishing sweep (Stage 5 §15; Master Spec blog scheduling).
 *
 * Runs every minute and flips any Blog post whose scheduled publish time has
 * arrived. A distributed lock ensures only one instance runs the sweep at a
 * time across concurrent Trigger.dev workers.
 */
export const scheduledPublishTask = schedules.task({
  id: 'scheduled-publish-sweep',
  cron: '* * * * *',
  run: async () => {
    const release = await acquireLock('scheduled-publish', 55);
    if (!release) {
      logger.debug('scheduled-publish sweep already running; skipping');
      return;
    }
    try {
      const { publishedCount } = await publishDuePosts();
      if (publishedCount > 0) {
        logger.info({ publishedCount }, 'scheduled-publish sweep published due posts');
      }
    } finally {
      await release();
    }
  },
});

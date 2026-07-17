'use server';

import { globalSearch as _globalSearch } from '@/lib/services/search-service';
import type { SearchResult } from '@/lib/services/search-service';
import type { ActionResult } from '@/lib/types';

export type { SearchResult };

/** Server Action boundary for Global Search (see blog-actions.ts for rationale). */
export async function globalSearch(query: string): Promise<ActionResult<SearchResult[]>> {
  return _globalSearch(query);
}

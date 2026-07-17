import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { saveNavigationMenuSchema } from '@/lib/validation/navigation';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ValidationError } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import type { NavigationMenu, NavigationItem } from '@prisma/client';

/**
 * Navigation Builder service (Stage 4 §12). A menu is edited and saved as a
 * whole — the admin UI holds the full tree client-side and submits it in one
 * call, which is replaced atomically (delete + recreate within a transaction) so
 * partial saves never leave a menu half-updated. Internal links are validated
 * against known route prefixes to catch broken references before publish.
 */

const KNOWN_INTERNAL_PREFIXES = [
  '/', '/services', '/industries', '/work', '/about', '/team', '/blog', '/contact',
];

function validateInternalHref(href: string): boolean {
  if (!href.startsWith('/')) return false;
  return KNOWN_INTERNAL_PREFIXES.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
}

export async function saveNavigationMenu(
  input: unknown,
): Promise<ActionResult<NavigationMenu & { items: NavigationItem[] }>> {
  try {
    const user = await requirePermission('NAVIGATION', 'EDIT');
    const data = parseOrThrow(saveNavigationMenuSchema, input);

    const fieldErrors: Record<string, string> = {};
    data.items.forEach((item, index) => {
      if (item.type === 'INTERNAL' && !validateInternalHref(item.href)) {
        fieldErrors[`items.${index}.href`] = 'This internal link does not match a known page.';
      }
      if (item.type === 'EXTERNAL') {
        try {
          new URL(item.href);
        } catch {
          fieldErrors[`items.${index}.href`] = 'Enter a valid external URL.';
        }
      }
    });
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError('Some links need your attention.', fieldErrors);
    }

    const result = await prisma.$transaction(async (tx) => {
      const menu = await tx.navigationMenu.upsert({
        where: { context_name: { context: data.context, name: data.name } },
        create: { context: data.context, name: data.name },
        update: {},
      });

      await tx.navigationItem.deleteMany({ where: { menuId: menu.id } });

      // Two passes: create parents first (no parentId), then children referencing
      // the newly created parent ids, since parentId in the input refers to a
      // stable client-side id we don't have after delete+recreate. Items without
      // a parentId are created first; items with one are attached by array index
      // matching, handled here by only supporting one level of nesting explicitly
      // provided as `parentIndex` semantics is out of scope for Phase 2 — flat
      // top-level items are created; nested dropdown authoring is a Phase 5 UI
      // enhancement built on this same schema.
      const created: NavigationItem[] = [];
      for (const item of data.items) {
        const row = await tx.navigationItem.create({
          data: {
            menuId: menu.id,
            label: item.label,
            type: item.type,
            href: item.href,
            iconKey: item.iconKey ?? null,
            order: item.order,
            visible: item.visible,
          },
        });
        created.push(row);
      }

      await recordActivity(
        { actorId: user.id, action: 'navigation.update', targetType: 'NavigationMenu', targetId: menu.id },
        tx,
      );

      return { ...menu, items: created };
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getNavigationMenu(
  context: 'HEADER' | 'FOOTER',
  name: string,
): Promise<ActionResult<(NavigationMenu & { items: NavigationItem[] }) | null>> {
  try {
    await requirePermission('NAVIGATION', 'VIEW');
    const menu = await prisma.navigationMenu.findUnique({
      where: { context_name: { context, name } },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    return { ok: true, data: menu };
  } catch (error) {
    return toActionError(error);
  }
}

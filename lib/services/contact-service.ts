import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { contactFormSchema, contactListSchema, updateContactSchema, addNoteSchema, type ContactListInput } from '@/lib/validation/contact';
import { enforceRateLimit, getClientIp } from '@/lib/security/request';
import { recordActivity } from '@/lib/logging/activity';
import { notify } from '@/lib/services/notification-service';
import { enqueueEmail } from '@/lib/jobs/client';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult, Paginated } from '@/lib/types';
import type { ContactRequest, Prisma } from '@prisma/client';
import { clientEnv } from '@/lib/config/env';

/**
 * Contact system (Stage 3 Page 11, Stage 4 §8). Public submission is
 * unauthenticated but rate-limited + honeypot-protected; on success it writes
 * the request, notifies Sales/Support, and emails the team. Admin management
 * (list/filter/assign/notes/export) is fully RBAC-gated.
 */
export async function submitContactForm(input: unknown): Promise<ActionResult<{ submitted: true }>> {
  try {
    const data = parseOrThrow(contactFormSchema, input);
    const ip = await getClientIp();
    await enforceRateLimit('publicForm', `contact:${ip}`);

    const request = await prisma.contactRequest.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        serviceInterest: data.serviceInterest ?? null,
        budget: data.budget ?? null,
        message: data.message,
        ip,
      },
    });

    await notify({
      type: 'CONTACT',
      title: `New contact request from ${data.name}`,
      body: data.message.slice(0, 140),
      link: `/admin/contacts`,
      targetRole: 'SALES',
    });

    await enqueueEmail({
      to: clientEnv.NEXT_PUBLIC_APP_URL.includes('localhost') ? 'team@adeelit.local' : 'sales@adeelit.example',
      subject: `New contact request: ${data.name}`,
      html: `<p><strong>${data.name}</strong> (${data.email}) submitted the contact form.</p><p>${data.message}</p>`,
      text: `${data.name} (${data.email}): ${data.message}`,
      replyTo: data.email,
    });

    await recordActivity({ action: 'contact.submitted', targetType: 'ContactRequest', targetId: request.id, ip });

    return { ok: true, data: { submitted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listContactRequests(input: ContactListInput): Promise<ActionResult<Paginated<ContactRequest>>> {
  try {
    await requirePermission('CONTACTS', 'VIEW');
    const { page, pageSize, replyStatus, assignedUserId, search } = parseOrThrow(contactListSchema, input);
    const where: Prisma.ContactRequestWhereInput = {
      ...(replyStatus !== undefined ? { replyStatus } : {}),
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.contactRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.contactRequest.count({ where }),
    ]);
    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateContactRequest(input: unknown): Promise<ActionResult<ContactRequest>> {
  try {
    const user = await requirePermission('CONTACTS', 'EDIT');
    const data = parseOrThrow(updateContactSchema, input);
    const updated = await prisma.contactRequest.update({
      where: { id: data.id },
      data: {
        ...(data.replyStatus !== undefined ? { replyStatus: data.replyStatus } : {}),
        ...(data.assignedUserId !== undefined ? { assignedUserId: data.assignedUserId } : {}),
      },
    });
    await recordActivity({ actorId: user.id, action: 'contact.update', targetType: 'ContactRequest', targetId: updated.id });
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteContactRequest(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('CONTACTS', 'DELETE');
    await prisma.contactRequest.delete({ where: { id } });
    await recordActivity({ actorId: user.id, action: 'contact.delete', targetType: 'ContactRequest', targetId: id });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addContactNote(input: unknown): Promise<ActionResult<{ added: true }>> {
  try {
    const user = await requirePermission('CONTACTS', 'EDIT');
    const data = parseOrThrow(addNoteSchema, input);
    await prisma.note.create({
      data: { body: data.body, authorId: user.id, contactId: data.contactId ?? null },
    });
    return { ok: true, data: { added: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** CSV export of contact requests for the current filter (Stage 4 §8). */
export async function exportContactRequestsCsv(input: ContactListInput): Promise<ActionResult<string>> {
  try {
    await requirePermission('CONTACTS', 'VIEW');
    const { replyStatus, assignedUserId, search } = parseOrThrow(contactListSchema, input);
    const where: Prisma.ContactRequestWhereInput = {
      ...(replyStatus !== undefined ? { replyStatus } : {}),
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };
    const rows = await prisma.contactRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    const header = 'Name,Email,Company,Phone,Service,Message,Status,Date\n';
    const body = rows
      .map((r) =>
        [r.name, r.email, r.company ?? '', r.phone ?? '', r.serviceInterest ?? '', r.message.replace(/[\r\n,]/g, ' '), r.replyStatus, r.createdAt.toISOString()]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    return { ok: true, data: header + body };
  } catch (error) {
    return toActionError(error);
  }
}

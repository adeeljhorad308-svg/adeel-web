import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import {
  leadListSchema,
  upsertLeadSchema,
  moveLeadStageSchema,
  type LeadListInput,
} from '@/lib/validation/crm';
import { recordActivity } from '@/lib/logging/activity';
import { notify } from '@/lib/services/notification-service';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Lead, Prisma } from '@prisma/client';

/** CRM / Leads service (Stage 4 §9). */

export async function listLeads(input: LeadListInput): Promise<ActionResult<Paginated<Lead>>> {
  try {
    await requirePermission('CRM', 'VIEW');
    const { page, pageSize, status, priority, assignedUserId, search } = parseOrThrow(
      leadListSchema,
      input,
    );
    const where: Prisma.LeadWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { order: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);
    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertLead(input: unknown): Promise<ActionResult<Lead>> {
  try {
    const data = parseOrThrow(upsertLeadSchema, input);
    const user = await requirePermission('CRM', data.id ? 'EDIT' : 'CREATE');
    const payload = {
      name: data.name,
      company: data.company ?? null,
      email: data.email,
      phone: data.phone ?? null,
      country: data.country ?? null,
      industry: data.industry ?? null,
      budget: data.budget ?? null,
      timeline: data.timeline ?? null,
      source: data.source ?? null,
      status: data.status,
      priority: data.priority,
      assignedUserId: data.assignedUserId ?? null,
      followUpDate: data.followUpDate ?? null,
      proposalSent: data.proposalSent,
      lostReason: data.lostReason ?? null,
    };
    const lead = data.id
      ? await prisma.lead.update({ where: { id: data.id }, data: payload })
      : await prisma.lead.create({ data: payload });

    if (!data.id) {
      await notify({
        type: 'LEAD',
        title: `New lead: ${data.name}`,
        link: '/admin/crm',
        targetRole: 'SALES',
      });
    }
    await recordActivity({
      actorId: user.id,
      action: data.id ? 'crm.lead.update' : 'crm.lead.create',
      targetType: 'Lead',
      targetId: lead.id,
    });
    return { ok: true, data: lead };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveLeadStage(input: unknown): Promise<ActionResult<Lead>> {
  try {
    const user = await requirePermission('CRM', 'EDIT');
    const data = parseOrThrow(moveLeadStageSchema, input);
    const lead = await prisma.lead.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(data.lostReason !== undefined ? { lostReason: data.lostReason } : {}),
      },
    });
    await recordActivity({
      actorId: user.id,
      action: 'crm.lead.stage_change',
      targetType: 'Lead',
      targetId: lead.id,
      metadata: { status: data.status },
    });
    return { ok: true, data: lead };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteLead(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('CRM', 'DELETE');
    await prisma.lead.delete({ where: { id } });
    await recordActivity({
      actorId: user.id,
      action: 'crm.lead.delete',
      targetType: 'Lead',
      targetId: id,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addLeadNote(
  leadId: string,
  body: string,
): Promise<ActionResult<{ added: true }>> {
  try {
    const user = await requirePermission('CRM', 'EDIT');
    await prisma.note.create({ data: { body, authorId: user.id, leadId } });
    return { ok: true, data: { added: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Convert a Contact Request into a CRM Lead (Stage 4 §8 "convert to lead"). */
export async function convertContactToLead(contactId: string): Promise<ActionResult<Lead>> {
  try {
    const user = await requirePermission('CRM', 'CREATE');
    const contact = await prisma.contactRequest.findUniqueOrThrow({ where: { id: contactId } });
    const lead = await prisma.lead.create({
      data: {
        name: contact.name,
        email: contact.email,
        company: contact.company,
        phone: contact.phone,
        industry: contact.serviceInterest,
        budget: contact.budget,
        source: 'Contact form',
        status: 'NEW',
        priority: 'MEDIUM',
      },
    });
    await prisma.contactRequest.update({
      where: { id: contactId },
      data: { replyStatus: 'REPLIED' },
    });
    await recordActivity({
      actorId: user.id,
      action: 'crm.lead.convert_from_contact',
      targetType: 'Lead',
      targetId: lead.id,
    });
    return { ok: true, data: lead };
  } catch (error) {
    return toActionError(error);
  }
}

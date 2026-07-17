import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { teamListSchema, upsertTeamMemberSchema, type TeamListInput } from '@/lib/validation/team';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { TeamMember, Prisma } from '@prisma/client';

/** Team Management service (Stage 4 §5). Same transaction/version-lock pattern. */

export async function listTeamMembers(input: TeamListInput): Promise<ActionResult<Paginated<TeamMember>>> {
  try {
    await requirePermission('TEAM', 'VIEW');
    const { page, pageSize, active, department } = parseOrThrow(teamListSchema, input);

    const where: Prisma.TeamMemberWhereInput = {
      deletedAt: null,
      ...(active !== undefined ? { active } : {}),
      ...(department !== undefined ? { department } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.teamMember.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.teamMember.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getTeamMember(id: string): Promise<ActionResult<TeamMember | null>> {
  try {
    await requirePermission('TEAM', 'VIEW');
    const member = await prisma.teamMember.findFirst({
      where: { id, deletedAt: null },
      include: { skills: true, socialLinks: true },
    });
    return { ok: true, data: member };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertTeamMember(input: unknown): Promise<ActionResult<TeamMember>> {
  try {
    const data = parseOrThrow(upsertTeamMemberSchema, input);
    const user = await requirePermission('TEAM', data.id ? 'EDIT' : 'CREATE');

    const result = await prisma.$transaction(async (tx) => {
      let member: TeamMember;
      const baseData = {
        name: data.name,
        designation: data.designation,
        bio: data.bio ?? null,
        experience: data.experience ?? null,
        photoId: data.photoId ?? null,
        department: data.department ?? null,
        order: data.order,
        active: data.active,
      };

      if (data.id) {
        const current = await tx.teamMember.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) throw new ConflictError();

        member = await tx.teamMember.update({
          where: { id: data.id },
          data: { ...baseData, version: { increment: 1 } },
        });

        await tx.teamMemberSkill.deleteMany({ where: { teamMemberId: member.id } });
        await tx.socialLink.deleteMany({ where: { teamMemberId: member.id } });
      } else {
        member = await tx.teamMember.create({ data: baseData });
      }

      if (data.skills.length > 0) {
        await tx.teamMemberSkill.createMany({
          data: data.skills.map((s) => ({ ...s, teamMemberId: member.id })),
        });
      }
      if (data.socialLinks.length > 0) {
        await tx.socialLink.createMany({
          data: data.socialLinks
            .filter((s) => s.url !== undefined)
            .map((s) => ({ ...s, url: s.url as string, teamMemberId: member.id })),
        });
      }

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'team.update' : 'team.create',
          targetType: 'TeamMember',
          targetId: member.id,
        },
        tx,
      );

      return member;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTeamMember(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('TEAM', 'DELETE');
    await prisma.teamMember.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await recordActivity({ actorId: user.id, action: 'team.delete', targetType: 'TeamMember', targetId: id });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

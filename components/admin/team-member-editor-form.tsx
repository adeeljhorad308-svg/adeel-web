'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { upsertTeamMember } from '@/lib/actions/team-actions';
import { upsertTeamMemberSchema, type UpsertTeamMemberInput } from '@/lib/validation/team';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import type { TeamMember } from '@prisma/client';

const SOCIAL_PLATFORMS = ['github', 'linkedin', 'facebook', 'instagram', 'whatsapp', 'email', 'youtube', 'x', 'tiktok'] as const;

/** Team member editor (Stage 4 §5). */
export function TeamMemberEditorForm({ member }: { member?: TeamMember }): React.ReactElement {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<UpsertTeamMemberInput>({
    resolver: zodResolver(upsertTeamMemberSchema),
    defaultValues: member
      ? {
          id: member.id,
          version: member.version,
          name: member.name,
          designation: member.designation,
          bio: member.bio ?? undefined,
          experience: member.experience ?? undefined,
          department: member.department ?? undefined,
          active: member.active,
          skills: [],
          socialLinks: SOCIAL_PLATFORMS.map((platform) => ({ platform, url: '', visible: true })),
        }
      : {
          name: '',
          designation: '',
          active: true,
          skills: [],
          socialLinks: SOCIAL_PLATFORMS.map((platform) => ({ platform, url: '', visible: true })),
        },
  });

  const skills = useFieldArray({ control, name: 'skills' });

  async function onSubmit(values: UpsertTeamMemberInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertTeamMember(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/team');
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-6" noValidate>
      {member && <input type="hidden" {...register('id')} />}
      {member && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

      {formError && <Alert tone="error">{formError}</Alert>}
      {conflict && (
        <Alert tone="error">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>This team member was changed by someone else since you opened it.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" required error={errors.name?.message} {...register('name')} />
        <FormField label="Designation" required error={errors.designation?.message} {...register('designation')} />
      </div>

      <FormField label="Department" {...register('department')} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-small font-semibold text-[color:var(--color-text-primary)]">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 text-body"
          {...register('bio')}
        />
      </div>

      <FormField label="Experience" hint="e.g. 8 years" {...register('experience')} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">Skills</legend>
        {skills.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              className="h-10 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small"
              {...register(`skills.${index}.label` as const)}
            />
            <button
              type="button"
              onClick={() => skills.remove(index)}
              aria-label="Remove skill"
              className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => skills.append({ label: '', order: skills.fields.length })}
          className="w-fit"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add skill
        </Button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">Social links</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform, index) => (
            <FormField
              key={platform}
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              placeholder="https://…"
              {...register(`socialLinks.${index}.url` as const)}
            />
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
        <input type="checkbox" {...register('active')} className="h-4 w-4 rounded border-[color:var(--color-border-default)]" />
        Active (shown on the public site)
      </label>

      <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/team')}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {member ? 'Save changes' : 'Add member'}
        </Button>
      </div>
    </form>
  );
}

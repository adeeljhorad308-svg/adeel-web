'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateCompanySettings,
  updateSocialLinks,
  updateAnalyticsSettings,
} from '@/lib/actions/settings-actions';
import {
  companySettingsSchema,
  socialLinksSchema,
  analyticsSettingsSchema,
  type CompanySettingsInput,
  type SocialLinksInput,
  type AnalyticsSettingsInput,
} from '@/lib/validation/settings';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

type Tab = 'company' | 'social' | 'analytics';

/**
 * Settings (Stage 4 §17). Tabbed sections save independently — editing Company
 * details never risks Social Links or Analytics IDs. Every field here is
 * non-secret by construction (the schemas admit no API-key-shaped fields);
 * secrets remain environment-only per Stage 5 §16.
 */
export function SettingsClient({
  company,
  social,
  analytics,
}: {
  company: Record<string, unknown>;
  social: Record<string, unknown>;
  analytics: Record<string, unknown>;
}): React.ReactElement {
  const [tab, setTab] = useState<Tab>('company');

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Settings sections" className="flex gap-1 border-b border-[color:var(--color-border-default)]">
        {(['company', 'social', 'analytics'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-small font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-[color:var(--color-brand-primary)] text-[color:var(--color-brand-primary)]'
                : 'text-[color:var(--color-text-muted)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'company' && <CompanyForm initial={company as CompanySettingsInput} />}
      {tab === 'social' && <SocialForm initial={social as { links?: SocialLinksInput['links'] }} />}
      {tab === 'analytics' && <AnalyticsForm initial={analytics as AnalyticsSettingsInput} />}
    </div>
  );
}

function CompanyForm({ initial }: { initial: CompanySettingsInput }): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: CompanySettingsInput): Promise<void> {
    setSubmitting(true);
    const result = await updateCompanySettings(values);
    setSubmitting(false);
    setSaved(result.ok);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex max-w-xl flex-col gap-4">
      {saved && <Alert tone="success">Company settings saved.</Alert>}
      <FormField label="Company name" {...register('name')} />
      <FormField label="Tagline" {...register('tagline')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Phone" {...register('phone')} />
        <FormField label="WhatsApp" {...register('whatsapp')} />
      </div>
      <FormField label="Email" type="email" {...register('email')} />
      <FormField label="Address" {...register('address')} />
      <FormField label="Office hours" {...register('officeHours')} />
      <FormField label="Google Maps embed URL" {...register('googleMapsEmbedUrl')} />
      <Button type="submit" loading={submitting} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  github: 'GitHub', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram',
  whatsapp: 'WhatsApp', email: 'Email', youtube: 'YouTube', x: 'X', tiktok: 'TikTok',
};

function SocialForm({ initial }: { initial: { links?: SocialLinksInput['links'] } }): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const platforms = Object.keys(SOCIAL_PLATFORM_LABELS) as SocialLinksInput['links'][number]['platform'][];
  const existingByPlatform = new Map((initial.links ?? []).map((l) => [l.platform, l]));

  const { register, handleSubmit } = useForm<SocialLinksInput>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      links: platforms.map((platform) => ({
        platform,
        url: existingByPlatform.get(platform)?.url ?? '',
        visible: existingByPlatform.get(platform)?.visible ?? true,
      })),
    },
  });

  async function onSubmit(values: SocialLinksInput): Promise<void> {
    setSubmitting(true);
    const result = await updateSocialLinks(values);
    setSubmitting(false);
    setSaved(result.ok);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex max-w-xl flex-col gap-4">
      {saved && <Alert tone="success">Social links saved.</Alert>}
      <p className="text-small text-[color:var(--color-text-muted)]">
        Leave a URL empty to hide that icon on the public site.
      </p>
      {platforms.map((platform, index) => (
        <FormField
          key={platform}
          label={SOCIAL_PLATFORM_LABELS[platform] ?? platform}
          placeholder="https://…"
          {...register(`links.${index}.url` as const)}
        />
      ))}
      <Button type="submit" loading={submitting} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}

function AnalyticsForm({ initial }: { initial: AnalyticsSettingsInput }): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<AnalyticsSettingsInput>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: AnalyticsSettingsInput): Promise<void> {
    setSubmitting(true);
    const result = await updateAnalyticsSettings(values);
    setSubmitting(false);
    setSaved(result.ok);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex max-w-xl flex-col gap-4">
      {saved && <Alert tone="success">Analytics settings saved.</Alert>}
      <p className="text-small text-[color:var(--color-text-muted)]">
        These IDs are not secrets — API keys and passwords are configured via environment variables.
      </p>
      <FormField label="Google Analytics ID" {...register('gaId')} />
      <FormField label="Google Tag Manager ID" {...register('gtmId')} />
      <FormField label="Meta Pixel ID" {...register('metaPixelId')} />
      <FormField label="Microsoft Clarity ID" {...register('clarityId')} />
      <Button type="submit" loading={submitting} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}

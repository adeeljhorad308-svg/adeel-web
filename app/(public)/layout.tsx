import { SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';

/** Public route-group layout: header + footer wrap every public page. */
export default function PublicLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}

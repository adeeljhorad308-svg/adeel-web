import type { Module } from '@/lib/constants';

/**
 * Admin navigation definition (Stage 4 §1 shell). Each item maps to a Module so
 * the sidebar can be filtered by the viewer's permissions — an item shows only if
 * the user has at least VIEW on its module. Icon names reference lucide-react.
 * Grouping mirrors the dashboard's information architecture.
 */

export interface AdminNavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly module: Module;
}

export interface AdminNavGroup {
  readonly label: string;
  readonly items: readonly AdminNavItem[];
}

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard', module: 'DASHBOARD' }],
  },
  {
    label: 'Content',
    items: [
      { label: 'Portfolio', href: '/admin/portfolio', icon: 'FolderKanban', module: 'PORTFOLIO' },
      { label: 'Services', href: '/admin/services', icon: 'Wrench', module: 'SERVICES' },
      { label: 'Industries', href: '/admin/industries', icon: 'Building2', module: 'INDUSTRIES' },
      { label: 'Team', href: '/admin/team', icon: 'Users', module: 'TEAM' },
      { label: 'Testimonials', href: '/admin/testimonials', icon: 'Quote', module: 'TESTIMONIALS' },
      { label: 'Blog', href: '/admin/blog', icon: 'FileText', module: 'BLOG' },
      { label: 'Media', href: '/admin/media', icon: 'Image', module: 'MEDIA' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Contacts', href: '/admin/contacts', icon: 'Inbox', module: 'CONTACTS' },
      { label: 'Leads', href: '/admin/crm', icon: 'Target', module: 'CRM' },
    ],
  },
  {
    label: 'Site',
    items: [
      { label: 'Theme', href: '/admin/theme', icon: 'Palette', module: 'THEME' },
      { label: 'Navigation', href: '/admin/navigation', icon: 'Menu', module: 'NAVIGATION' },
      { label: 'Footer', href: '/admin/footer', icon: 'PanelBottom', module: 'FOOTER' },
      { label: 'SEO', href: '/admin/seo', icon: 'Search', module: 'SEO' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users & Roles', href: '/admin/users', icon: 'ShieldCheck', module: 'USERS' },
      { label: 'Notifications', href: '/admin/notifications', icon: 'Bell', module: 'NOTIFICATIONS' },
      { label: 'Activity', href: '/admin/activity', icon: 'ScrollText', module: 'ACTIVITY' },
      { label: 'Settings', href: '/admin/settings', icon: 'Settings', module: 'SETTINGS' },
    ],
  },
];

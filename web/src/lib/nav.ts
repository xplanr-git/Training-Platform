/**
 * Admin navigation model. Ported from the legacy AdminSidebar so the full
 * breadth stays visible (it's a sales asset), but each item is marked `live`
 * (wired this MVP) or `gated` (renders a "coming soon" panel). Gated items keep
 * their place in the nav per CLAUDE.md / the MVP brief §7.
 *
 * `href` values are relative to /t/[slug]/admin.
 */
export type NavStatus = 'live' | 'gated';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  status: NavStatus;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const gated = (id: string, label: string): NavItem => ({
  id,
  label,
  href: `/coming-soon?feature=${encodeURIComponent(label)}`,
  status: 'gated',
});

const live = (id: string, label: string, href: string): NavItem => ({
  id,
  label,
  href,
  status: 'live',
});

export const ADMIN_NAV: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [live('overview', 'Dashboard', '')],
  },
  {
    id: 'courses',
    label: 'Courses & Programs',
    items: [
      live('courses', 'Courses', '/courses'),
      live('certificates', 'Certificates', '/certificates'),
      gated('review-center', 'Review Centre'),
      gated('question-banks', 'Question Banks'),
      gated('gradebook', 'Gradebook'),
    ],
  },
  {
    id: 'website',
    label: 'Website',
    items: [
      gated('website-builder', 'Landing Page Builder'),
      gated('website-pages', 'Pages'),
      gated('website-settings', 'Website Settings'),
    ],
  },
  {
    id: 'people',
    label: 'Users',
    items: [
      live('people', 'All Users', '/people'),
      gated('user-roles', 'User Roles'),
      gated('leads', 'Leads'),
      gated('user-groups', 'User Groups'),
      gated('multiple-seats', 'Multiple Seats'),
      gated('tags', 'Tags'),
      gated('user-fields', 'User Fields'),
      gated('approvals', 'Approvals'),
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    items: [
      gated('community', 'Community'),
      gated('inbox', 'Inbox'),
      gated('mass-emails', 'Mass Emails'),
      gated('email-templates', 'Email Templates'),
    ],
  },
  {
    id: 'commerce',
    label: 'E-commerce',
    items: [
      gated('billing', 'Plans & Billing'),
      gated('offers', 'Offers'),
      gated('gifts', 'Gifts'),
      gated('licenses', 'Licenses'),
      gated('cart-checkout', 'Cart & Checkout'),
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      gated('affiliate-program', 'Affiliate Programme'),
      gated('marketing-forms', 'Marketing Forms'),
      gated('nps', 'NPS'),
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      live('analytics', 'Insights', '/analytics'),
      gated('training-matrix', 'Training Matrix'),
      gated('scheduled-reports', 'Scheduled Reports'),
      gated('activity-log', 'Activity Log'),
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    items: [
      gated('mobile-design', 'Design'),
      gated('app-settings', 'App Settings'),
      gated('launch', 'Launch'),
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      live('school', 'Academy Settings', '/settings'),
      live('team', 'Team Management', '/people'),
      gated('billing-settings', 'Billing'),
      gated('security', 'Security'),
      gated('privacy', 'Privacy / GDPR'),
      gated('preferences', 'Preferences'),
    ],
  },
];

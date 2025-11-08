import type { AdminNavItem } from '../types/navigation';

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Messages',
    href: '/',
    match: (path) =>
      path === '/' ||
      (path.startsWith('/messages') && !path.startsWith('/messages/new')),
  },
  {
    label: 'Créer un message',
    href: '/messages/new',
    match: (path) => path.startsWith('/messages/new'),
  },
];


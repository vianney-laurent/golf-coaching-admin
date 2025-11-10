import type { AdminNavItem } from '../types/navigation';

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/',
    match: (path) => path === '/',
  },
  {
    label: 'Gestion utilisateurs',
    href: '/users',
    match: (path) => path === '/users' || path.startsWith('/users/'),
  },
  {
    label: 'Messages in-app',
    href: '/messages',
    match: (path) => path === '/messages' || path.startsWith('/messages/'),
  },
];


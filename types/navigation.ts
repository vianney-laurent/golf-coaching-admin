export type AdminNavItem = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  match?: (path: string) => boolean;
};


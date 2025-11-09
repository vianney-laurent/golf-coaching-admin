import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { AdminNavItem } from '../../types/navigation';
import { ADMIN_NAV_ITEMS } from '../../lib/navigation';
import { UserMenu } from './UserMenu';

type Breadcrumb = {
  label: string;
  href?: string;
};

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  headerActions?: ReactNode;
  navItems?: AdminNavItem[];
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  brandLabel?: string;
  brandHref?: string;
};

const HamburgerIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 7H20M4 12H20M4 17H20"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 6L18 18M6 18L18 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AppShell({
  title,
  description,
  actions,
  headerActions,
  navItems = ADMIN_NAV_ITEMS,
  breadcrumbs,
  children,
  brandLabel = 'My Swing Admin',
  brandHref = '/',
}: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  const currentPath = router.asPath;

  const renderNavItems = (items: AdminNavItem[]) =>
    items.map((item) => {
      const isActive = item.match
        ? item.match(currentPath)
        : currentPath === item.href;

      const linkProps = item.external
        ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
        : { href: item.href };

      return (
        <Link
          key={item.href}
          {...linkProps}
          className="ms-shell__nav-link"
          data-active={isActive ? 'true' : undefined}
        >
          <span>{item.label}</span>
          {item.description ? (
            <span className="ms-shell__nav-description">{item.description}</span>
          ) : null}
        </Link>
      );
    });

  return (
    <div className="ms-shell">
      <header className="ms-shell__header">
        <div className="ms-shell__header-inner">
          <Link href={brandHref} className="ms-shell__brand">
            <span className="ms-shell__brand-badge">MS</span>
            <span>{brandLabel}</span>
          </Link>

            <div className="ms-toolbar ms-toolbar--end">
              {headerActions ? <div className="ms-toolbar__actions">{headerActions}</div> : null}
              {navItems.length > 0 ? (
                <button
                  type="button"
                  className="ms-shell__nav-toggle"
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
                  onClick={() => setMobileMenuOpen((value) => !value)}
                >
                  {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                </button>
              ) : null}
              <UserMenu />
            </div>
        </div>

        {navItems.length > 0 ? (
          <nav
            className="ms-shell__nav"
            data-open={mobileMenuOpen ? 'true' : undefined}
            aria-label="Navigation principale"
          >
            {renderNavItems(navItems)}
          </nav>
        ) : null}
      </header>

      <div className="ms-shell__content">
        <div className="ms-shell__content-inner">
          <div className="ms-page-header">
            <div className="ms-page-header__main">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <div className="ms-breadcrumbs">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <span key={`${breadcrumb.label}-${index}`}>
                      {breadcrumb.href ? (
                        <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                      ) : (
                        breadcrumb.label
                      )}
                      {index < breadcrumbs.length - 1 ? (
                        <span className="ms-breadcrumbs__separator">/</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}

              <h1 className="ms-page-header__title">{title}</h1>
              {description ? (
                <p className="ms-page-header__description">{description}</p>
              ) : null}
            </div>

            {actions ? (
              <div className="ms-page-header__actions">{actions}</div>
            ) : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}


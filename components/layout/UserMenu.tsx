import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { classNames } from '../../lib/classNames';

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15 8L19 12L15 16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 12H9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 5H7C6.44772 5 6 5.44772 6 6V18C6 18.5523 6.44772 19 7 19H11"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DEFAULT_NAME = 'Administrateur';
const DEFAULT_EMAIL = 'Compte privé';

const getDisplayName = (user: ReturnType<typeof useUser>) => {
  if (!user) {
    return DEFAULT_NAME;
  }

  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.full_name,
    meta.fullName,
    meta.name,
    meta.display_name,
    meta.first_name && meta.last_name
      ? `${meta.first_name} ${meta.last_name}`
      : undefined,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  if (typeof user.email === 'string' && user.email.trim().length > 0) {
    const [localPart] = user.email.split('@');
    return localPart ?? DEFAULT_NAME;
  }

  return DEFAULT_NAME;
};

const getInitials = (name: string, email?: string | null) => {
  const parts = name.split(' ').filter((part) => part.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (typeof email === 'string' && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'MS';
};

export function UserMenu() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const email = user?.email ?? DEFAULT_EMAIL;
  const initials = useMemo(() => getInitials(displayName, user?.email), [displayName, user?.email]);

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleToggle = () => {
    setOpen((current) => !current);
  };

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="ms-user-menu" ref={containerRef}>
      <button
        type="button"
        className="ms-user-menu__trigger"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="ms-user-menu__avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="ms-user-menu__labels">
          <span className="ms-user-menu__name">{displayName}</span>
          <span className="ms-user-menu__email">{email}</span>
        </span>
        <ChevronIcon className="ms-user-menu__chevron" />
      </button>

      {open ? (
        <div className="ms-user-menu__dropdown" role="menu">
          <div className="ms-user-menu__summary" aria-hidden="true">
            <span className="ms-user-menu__summary-label">Connecté</span>
            <span className="ms-user-menu__summary-name">{displayName}</span>
            <span className="ms-user-menu__summary-email">{email}</span>
          </div>
          <button
            type="button"
            className={classNames(
              'ms-user-menu__logout',
              signingOut ? 'is-loading' : undefined
            )}
            onClick={handleSignOut}
            role="menuitem"
          >
            <LogoutIcon aria-hidden="true" />
            {signingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      ) : null}
    </div>
  );
}


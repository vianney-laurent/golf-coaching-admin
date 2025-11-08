import type { ReactNode } from 'react';
import { classNames } from '../../lib/classNames';

type BadgeTone = 'default' | 'success' | 'danger' | 'neutral';

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = 'default', children, className }: BadgeProps) {
  const badgeClass = classNames(
    'ms-badge',
    tone === 'success' ? 'ms-badge--success' : undefined,
    tone === 'danger' ? 'ms-badge--danger' : undefined,
    tone === 'neutral' ? 'ms-badge--neutral' : undefined,
    className
  );

  return <span className={badgeClass}>{children}</span>;
}


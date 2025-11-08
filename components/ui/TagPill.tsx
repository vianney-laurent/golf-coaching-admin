import type { ReactNode } from 'react';
import { classNames } from '../../lib/classNames';

type TagPillVariant = 'default' | 'banner' | 'overlay';

type TagPillProps = {
  variant?: TagPillVariant;
  children: ReactNode;
  className?: string;
};

export function TagPill({
  variant = 'default',
  children,
  className,
}: TagPillProps) {
  const tagClass = classNames(
    'ms-tag-pill',
    variant === 'banner' ? 'ms-tag-pill--banner' : undefined,
    variant === 'overlay' ? 'ms-tag-pill--overlay' : undefined,
    className
  );

  return <span className={tagClass}>{children}</span>;
}


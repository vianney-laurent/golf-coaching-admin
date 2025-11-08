import Link from 'next/link';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { classNames } from '../../lib/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  iconPosition = 'left',
  className,
  children,
  ...rest
}: ButtonProps) {
  const baseClassName = classNames(
    'ms-button',
    variant ? `ms-button--${variant}` : undefined,
    size === 'sm' ? 'ms-button--sm' : undefined,
    size === 'lg' ? 'ms-button--lg' : undefined,
    fullWidth ? 'ms-button--full' : undefined,
    className
  );

  const content = (
    <>
      {icon && iconPosition === 'left' ? (
        <span className="ms-button__icon ms-button__icon--left">{icon}</span>
      ) : null}
      <span className="ms-button__label">{children}</span>
      {icon && iconPosition === 'right' ? (
        <span className="ms-button__icon ms-button__icon--right">{icon}</span>
      ) : null}
    </>
  );

  if ('href' in rest && rest.href) {
    const { href, external, ...anchorProps } = rest;

    if (external) {
      return (
        <a
          href={href}
          className={baseClassName}
          target={anchorProps.target ?? '_blank'}
          rel={anchorProps.rel ?? 'noopener noreferrer'}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={baseClassName} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type={buttonProps.type ?? 'button'}
      className={baseClassName}
      {...buttonProps}
    >
      {content}
    </button>
  );
}


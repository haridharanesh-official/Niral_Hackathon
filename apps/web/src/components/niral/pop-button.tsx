import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './niral.module.css';

// Adapted from the official Vengeance UI registry:
// https://www.vengenceui.com/r/pop-button.json
// Keeps the raised shadow, hover compression and active compression; uses
// scoped NIRAL tokens and real anchors for navigation instead of nested buttons.
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  children: ReactNode;
  cream?: boolean;
};
export function PopButton({ href, children, cream, className = '', ...props }: Props) {
  const classes = `${styles.pop} ${cream ? styles.cream : ''} ${className}`;
  if (href)
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

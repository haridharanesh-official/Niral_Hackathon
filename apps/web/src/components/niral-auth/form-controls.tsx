'use client';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validatePasswordPolicy } from '@hackos/shared';
import styles from './auth.module.css';
export function TactileField({
  label,
  error,
  password = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  password?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={password ? styles.password : undefined}>
        <input
          {...props}
          id={id}
          type={password ? (visible ? 'text' : 'password') : (props.type ?? 'text')}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : props['aria-describedby']}
        />
        {password && (
          <button
            className={styles.eye}
            type="button"
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span className={styles.error} id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
export function PasswordStrength({ password }: { password: string }) {
  const errors = validatePasswordPolicy(password);
  const score = password ? Math.max(0, 4 - errors.length) : 0;
  return (
    <div>
      <div className={styles.strength} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} data-filled={i < score} />
        ))}
      </div>
      <p className={styles.hint} aria-live="polite">
        {!password
          ? 'Use 12–128 characters with uppercase, lowercase and a number.'
          : errors.length
            ? errors.join('. ')
            : 'Password requirements met.'}
      </p>
    </div>
  );
}
export function emailError(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254
    ? ''
    : 'Enter a valid email address.';
}

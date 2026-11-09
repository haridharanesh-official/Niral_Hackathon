import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { legalUpdated, legalVersion, type LegalSection } from './legal-content';
import styles from './legal.module.css';

export function LegalPage({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <PublicPageShell showInfoStrip={false}>
      <div className={styles.document}>
        <Link className={styles.back} href="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back to home
        </Link>
        <header className={styles.heading}>
          <span className={styles.eyebrow}>
            <FileText size={16} aria-hidden="true" /> NIRAL 2026 · LEGAL DOCUMENTS
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
          <dl className={styles.metadata}>
            <div>
              <dt>Version</dt>
              <dd>{legalVersion}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>
                <time dateTime="2026-11-08">{legalUpdated}</time>
              </dd>
            </div>
            <div>
              <dt>Effective date</dt>
              <dd>Pending approval</dd>
            </div>
          </dl>
        </header>
        <aside className={styles.notice} aria-label="Document review status">
          <strong>Draft for organizer and legal review</strong>
          <p>
            This document has no approved effective date. It does not establish Google
            verification, legal compliance or authorization to collect fees. Real payment
            collection and Gmail polling remain disabled.
          </p>
        </aside>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <details open>
              <summary>On this page</summary>
              <nav aria-label={`${title} contents`}>
                <ol>
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`}>{section.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          </aside>
          <article className={styles.article} aria-label={title}>
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} tabIndex={-1}>
                <h2>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <div className={styles.contact}>
              <h2>Contact the organizing team</h2>
              <p>
                <a href="mailto:iotclub.siet@gmail.com">iotclub.siet@gmail.com</a> ·
                General event contact; privacy/grievance designation pending.
              </p>
              <p>
                <Link href="/privacy-policy">Privacy Policy</Link> ·{' '}
                <Link href="/terms-of-service">Terms of Service</Link> ·{' '}
                <Link href="/rules">Event rules</Link>
              </p>
            </div>
          </article>
        </div>
      </div>
    </PublicPageShell>
  );
}

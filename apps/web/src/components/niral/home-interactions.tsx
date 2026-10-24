'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { ArrowRight, ArrowLeft, Menu, X, Cpu } from 'lucide-react';
import { emptyDraft } from '@/components/auth/register/schema';
import type { ThemeItem } from '@/types/home';
import { PopButton } from './pop-button';
import styles from './niral.module.css';

export const navigation = [
  'Home',
  'About',
  'Participate',
  'Tracks',
  'Problems',
  'Schedule',
  'Rules',
  'FAQ',
  'Contact',
];
export const routeFor = (name: string) =>
  name === 'Home' ? '/' : `/${name.toLowerCase()}`;

export function TactileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={styles.navCard}
      onPointerMove={(event: PointerEvent<HTMLAnchorElement>) => {
        if (
          event.pointerType !== 'mouse' ||
          !matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)')
            .matches
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          '--tilt-x',
          `${-(event.clientY - bounds.top - bounds.height / 2) / 55}deg`,
        );
        event.currentTarget.style.setProperty(
          '--tilt-y',
          `${(event.clientX - bounds.left - bounds.width / 2) / 55}deg`,
        );
      }}
      onPointerLeave={(event: PointerEvent<HTMLAnchorElement>) => {
        event.currentTarget.style.removeProperty('--tilt-x');
        event.currentTarget.style.removeProperty('--tilt-y');
      }}
    >
      {children}
    </Link>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div
      className={styles.mobileMenu}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation">
          {navigation.map((name) => (
            <Link onClick={() => setOpen(false)} key={name} href={routeFor(name)}>
              {name}
            </Link>
          ))}
          <Link href="/login">Sign In</Link>
          <Link href="/register">Register</Link>
        </nav>
      )}
    </div>
  );
}

export function RegistrationPreview({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  return (
    <section className={styles.panel} aria-labelledby="registration-title">
      <h3 id="registration-title">Start Your Journey</h3>
      <p>Create an account to register for NIRAL Hackathon 2026.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get('name') ?? '').trim();
          const college = String(data.get('college') ?? '').trim();
          if (!name || !college) {
            setError('Please enter your name and institution.');
            return;
          }
          try {
            const raw = sessionStorage.getItem('hackos.register.draft');
            let previous = {};
            try {
              previous = raw ? JSON.parse(raw) : {};
            } catch {
              /* Replace an invalid draft. */
            }
            const [firstName, ...lastName] = name.split(/\s+/);
            sessionStorage.setItem(
              'hackos.register.draft',
              JSON.stringify({
                ...emptyDraft(),
                ...previous,
                firstName,
                lastName: lastName.join(' '),
                college,
                email: String(data.get('email')).trim(),
              }),
            );
            router.push('/register');
          } catch {
            setError(
              'Your browser cannot save a draft. Continue directly to registration using the link below.',
            );
          }
        }}
      >
        <div className={styles.fields}>
          <label>
            Full Name
            <input
              name="name"
              autoComplete="name"
              placeholder="Alex Johnson"
              required
              maxLength={100}
            />
          </label>
          <label>
            College / Institution
            <input
              name="college"
              autoComplete="organization"
              placeholder="Your college name"
              required
              maxLength={200}
            />
          </label>
          <label className={styles.emailField}>
            Email Address
            <input
              name="email"
              autoComplete="email"
              type="email"
              placeholder="you@college.edu"
              required
              maxLength={254}
            />
          </label>
        </div>
        <label className={styles.consent}>
          <input type="checkbox" required />{' '}
          <span>
            I agree to the <Link href="/rules">rules and code of conduct</Link>.
          </span>
        </label>
        {!enabled && (
          <p className={styles.notice}>
            Hackathon applications are not open yet. You can create your account and
            return when registration opens.
          </p>
        )}
        {error && (
          <p role="alert">
            {error} <Link href="/register">Continue to registration</Link>
          </p>
        )}
        <div className={styles.formAction}>
          <PopButton type="submit">
            Create Account <ArrowRight size={18} />
          </PopButton>
        </div>
      </form>
    </section>
  );
}

const journey = [
  [
    'Explore the event',
    'Learn about tracks, schedule, rules and participation.',
    '/about',
    'Explore NIRAL',
  ],
  [
    'Create an account',
    'Sign up with your details and start your journey.',
    '/register',
    'Create your account',
  ],
  [
    'Apply for the hackathon',
    'Complete your application when registration opens.',
    '/dashboard/enrollment',
    'View enrollment',
  ],
  [
    'Track your status',
    'Get updates and important announcements.',
    '/dashboard',
    'Open dashboard',
  ],
];
export function ParticipationJourney() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section className={styles.panel}>
      <h3>Participation Journey</h3>
      <p>Follow these simple steps to be a part of NIRAL 2026.</p>
      <ol className={styles.journey}>
        {journey.map(([title, description, href, link], index) => (
          <li key={title}>
            <button
              aria-expanded={active === index}
              aria-controls={`journey-${index}`}
              onClick={() => setActive(active === index ? null : index)}
            >
              <span className={styles.number}>{index + 1}</span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </button>
            <div
              id={`journey-${index}`}
              hidden={active !== index}
              className={styles.journeyDetail}
            >
              <Link href={href}>
                {link} <ArrowRight size={14} />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TrackShowcase({ tracks }: { tracks: ThemeItem[] }) {
  const [filter, setFilter] = useState('All');
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const categories = ['All', ...new Set(tracks.flatMap((track) => track.technologies))];
  const filtered = tracks.filter(
    (track) => filter === 'All' || track.technologies.includes(filter),
  );
  return (
    <section
      className={styles.tracks}
      id="innovation-tracks"
      aria-labelledby="tracks-title"
    >
      <div className={styles.tracksIntro}>
        <h3 id="tracks-title">Innovation Tracks</h3>
        <p>
          Explore diverse problem domains and build solutions for a smarter, more
          connected world.
        </p>
        <PopButton href="/tracks" cream>
          View All Tracks <ArrowRight size={16} />
        </PopButton>
      </div>
      {tracks.length === 0 ? (
        <div className={styles.teaser}>
          <Cpu size={36} />
          <h3>Tracks coming soon</h3>
          <p>
            Official innovation tracks and problem statements will be announced here.
            Bring your curiosity. We’ll bring the challenges.
          </p>
          <span>Stay tuned for official updates</span>
        </div>
      ) : (
        <div className={styles.trackBrowser}>
          <div className={styles.filters} aria-label="Filter tracks">
            {categories.map((category) => (
              <button
                key={category}
                aria-pressed={category === filter}
                onClick={() => {
                  setFilter(category);
                  setPosition(0);
                  setSelected(null);
                }}
              >
                {category}
              </button>
            ))}
          </div>
          <div className={styles.trackCards}>
            {filtered.slice(position, position + 3).map((track) => (
              <button
                key={track.id}
                className={styles.trackCard}
                aria-expanded={selected === track.id}
                onClick={() => setSelected(selected === track.id ? null : track.id)}
              >
                <Cpu />
                <strong>{track.title}</strong>
                <small>{track.description}</small>
                {selected === track.id && (
                  <span>{track.architecture || track.technologies.join(' · ')}</span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.carousel}>
            <button
              aria-label="Previous tracks"
              disabled={position === 0}
              onClick={() => setPosition(Math.max(0, position - 1))}
            >
              <ArrowLeft />
            </button>
            <span>
              {filtered.length ? position + 1 : 0}–
              {Math.min(position + 3, filtered.length)} of {filtered.length}
            </span>
            <button
              aria-label="Next tracks"
              disabled={position + 3 >= filtered.length}
              onClick={() => setPosition(position + 1)}
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

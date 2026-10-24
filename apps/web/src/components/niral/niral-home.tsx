import Link from 'next/link';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Layers,
  Megaphone,
  Box,
  FileText,
  Play,
} from 'lucide-react';
import { getContentStore } from '@/lib/content-store';
import { homeThemesSeed } from '@/services/home/seed';
import { HeroArt } from './hero-art';
import {
  MobileMenu,
  ParticipationJourney,
  RegistrationPreview,
  TrackShowcase,
  TactileLink,
} from './home-interactions';
import { PopButton } from './pop-button';
import styles from './niral.module.css';

const nav = [
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
const hrefFor = (name: string) => (name === 'Home' ? '/' : `/${name.toLowerCase()}`);
function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="NIRAL Hackathon 2026 home">
      <span>N</span>
      <div>
        <strong>NIRAL</strong>
        <small>HACKATHON 2026</small>
      </div>
    </Link>
  );
}

export async function NiralHome() {
  const store = getContentStore();
  let registrationEnabled = false;
  let venue = store.event.venue;
  let date = 'December 3–4, 2026';
  try {
    const response = await fetch(
      `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/current`,
      { cache: 'no-store', signal: AbortSignal.timeout(2000) },
    );
    if (response.ok) {
      const event = await response.json();
      registrationEnabled = event.registrationEnabled === true;
      venue = event.venueName || venue;
      if (event.startsAt && event.endsAt && event.id !== 'niral-2026-default') {
        const formatter = new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: event.timezone || 'Asia/Kolkata',
        });
        date = formatter.formatRange(new Date(event.startsAt), new Date(event.endsAt));
      }
    }
  } catch {
    /* Keep confirmed event details; never infer that applications are open. */
  }
  // The content store starts with active demo tracks. Only show content that
  // has actually been authored/published rather than advertising those seeds.
  const tracks = store.themes.filter(
    (track) =>
      track.status === 'active' &&
      !homeThemesSeed.some((seed) => JSON.stringify(seed) === JSON.stringify(track)),
  );
  const cards = [
    {
      title: '10 Public Pages',
      description: 'All event information in one place.',
      href: '/about',
      Icon: Layers,
    },
    {
      title: 'Official Updates',
      description: 'Get the latest announcements.',
      href: '/updates',
      Icon: Megaphone,
    },
    {
      title: tracks.length ? 'Innovation Tracks' : 'Tracks Coming Soon',
      description: 'Discover the available technology domains.',
      href: '/tracks',
      Icon: Box,
    },
    {
      title: 'FAQ & Rules',
      description: 'Everything you need to know.',
      href: '/faq',
      Icon: FileText,
    },
  ];
  return (
    <div className={styles.root}>
      <a className={styles.skip} href="#niral-main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Logo />
        <nav aria-label="Main navigation" className={styles.desktopNav}>
          {nav.map((name) => (
            <Link
              key={name}
              href={hrefFor(name)}
              aria-current={name === 'Home' ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <PopButton href="/login" cream>
            Sign In
          </PopButton>
          <PopButton href="/register">Register</PopButton>
        </div>
        <MobileMenu />
      </header>
      <main id="niral-main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <i />
              NIRAL 2026 · PUBLIC WEBSITE
            </div>
            <h1 id="home-title">
              <span className={styles.titleLine}>
                <mark>NIRAL Hackathon</mark> 2026
              </span>
              <br />
              Build what matters.
            </h1>
            <p>
              An innovation-driven hackathon at Sri Shakthi Institute of Engineering and
              Technology, focused on IoT and emerging technologies. Collaborate, create,
              and turn your ideas into real-world solutions.
            </p>
            <div className={styles.heroActions}>
              <PopButton href="/register">
                Register Now <ArrowRight size={19} />
              </PopButton>
              <PopButton href="/about" cream>
                <Play size={18} />
                Explore the Event
              </PopButton>
            </div>
          </div>
          <HeroArt />
        </section>
        <div className={styles.information}>
          <div>
            <CalendarDays />
            <span>{date}</span>
          </div>
          <Link href="/contact">
            <MapPin />
            <span>{venue}</span>
          </Link>
          <a href="mailto:iotclub.siet@gmail.com">
            <Mail />
            <span>iotclub.siet@gmail.com</span>
          </a>
          <a href="tel:+918508511975">
            <Phone />
            <span>+91 8508511975</span>
          </a>
        </div>
        <section className={styles.navigationCards} aria-label="Explore NIRAL">
          {cards.map(({ title, description, href, Icon }) => (
            <TactileLink key={title} href={href}>
              <div className={styles.cardTop}>
                <span className={styles.iconBox}>
                  <Icon size={27} />
                </span>
                <span className={styles.arrowBox}>
                  <ArrowRight size={18} />
                </span>
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
            </TactileLink>
          ))}
        </section>
        <section className={styles.getStarted} aria-labelledby="get-started-title">
          <div className={styles.sectionHeading}>
            <span>GET STARTED</span>
            <h2 id="get-started-title">
              Everything you need to <mark>join NIRAL.</mark>
            </h2>
            <p>
              From registration to the final showcase, we&apos;ve made the process simple
              and transparent
              <br className={styles.desktopBreak} /> so you can focus on what you do best
              — building amazing solutions.
            </p>
          </div>
          <div className={styles.journeyGrid}>
            <RegistrationPreview enabled={registrationEnabled} />
            <ParticipationJourney />
          </div>
        </section>
        <TrackShowcase tracks={tracks} />
      </main>
      <footer className={styles.footer}>
        <Logo />
        <p>Ideate. Build. Innovate.</p>
        <nav aria-label="Footer navigation">
          {['Home', 'About', 'Tracks', 'Schedule', 'Rules', 'FAQ', 'Contact'].map(
            (name) => (
              <Link key={name} href={hrefFor(name)}>
                {name}
              </Link>
            ),
          )}
        </nav>
        <a href="mailto:iotclub.siet@gmail.com" aria-label="Email the NIRAL team">
          <Mail size={19} />
        </a>
      </footer>
    </div>
  );
}

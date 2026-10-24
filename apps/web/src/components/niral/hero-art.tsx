'use client';

import { useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import { Code2, Lightbulb, Zap, Cpu, Users, MousePointer2 } from 'lucide-react';
import styles from './niral.module.css';

const labels = [
  {
    name: 'Ideas',
    Icon: Lightbulb,
    text: 'Start with a problem worth solving. Turn curiosity into a clear concept.',
  },
  {
    name: 'Build',
    Icon: Zap,
    text: 'Bring your concept to life through engineering and hands-on prototyping.',
  },
  {
    name: 'Innovate',
    Icon: Cpu,
    text: 'Explore new approaches to create meaningful, real-world solutions.',
  },
  {
    name: 'Collaborate',
    Icon: Users,
    text: 'Share your skills, learn from others, and build together.',
  },
];

export function HeroArt() {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 150, damping: 24 });
  const y = useSpring(0, { stiffness: 150, damping: 24 });
  const [active, setActive] = useState<number | null>(null);
  const [spin, setSpin] = useState(0);
  return (
    <div
      className={styles.art}
      onPointerMove={(event) => {
        if (
          reduced ||
          event.pointerType !== 'mouse' ||
          !matchMedia('(hover: hover)').matches
        )
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(-(event.clientY - rect.top - rect.height / 2) / 35);
        y.set((event.clientX - rect.left - rect.width / 2) / 35);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <motion.div className={styles.stack} style={{ rotateX: x, rotateY: y }}>
        <div className={styles.backPanel} aria-hidden="true">
          <span>● ● ●</span>
        </div>
        <div className={styles.sidePanel} aria-hidden="true" />
        <div className={styles.codeWindow}>
          <span className={styles.dots} aria-hidden="true">
            ● ● ●
          </span>
          <motion.button
            className={styles.codeTile}
            aria-label="Animate the code tile"
            onClick={() => setSpin(spin + 180)}
            animate={{ rotate: reduced ? 0 : spin }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <Code2 size={54} strokeWidth={1.6} />
          </motion.button>
          <span className={styles.cornerDots} aria-hidden="true">
            •••
            <br />
            •••
          </span>
        </div>
        <MousePointer2
          className={styles.cursor}
          aria-hidden="true"
          size={47}
          fill="#fd9b9b"
        />
      </motion.div>
      {labels.map(({ name, Icon }, index) => (
        <button
          key={name}
          className={`${styles.floating} ${styles[`float${index}`]}`}
          aria-pressed={active === index}
          aria-controls="hero-explanation"
          onClick={() => setActive(active === index ? null : index)}
        >
          <Icon size={23} />
          {name}
        </button>
      ))}
      <p id="hero-explanation" className={styles.artCaption} aria-live="polite">
        {active !== null ? labels[active].text : ''}
      </p>
    </div>
  );
}

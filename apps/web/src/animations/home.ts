export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export const stagger = (index: number, step = 0.05) => ({
  delay: index * step,
});

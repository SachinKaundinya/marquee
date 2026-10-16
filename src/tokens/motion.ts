// Motion Tokens strictly adhering to Emil Kowalski interaction physics and Marquee PRD 6.1

export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 1,
} as const;

export const drawerTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export const tapScale = {
  scale: 0.97,
  transition: { duration: 0.1, ease: "easeOut" },
} as const;

export const optimisticExitTransition = {
  scale: 0.95,
  opacity: 0,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },
} as const;

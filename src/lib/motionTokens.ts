/**
 * motionTokens — the ONE source of truth for every timing, easing, spring,
 * delay and interaction threshold used anywhere in the app.
 *
 * No component may hardcode a duration, easing curve, spring config, delay
 * or px threshold. Import from here instead. `src/index.css` mirrors these
 * as CSS variables (--ease-*, --duration-*) for pure-CSS transitions — if a
 * value changes here, the CSS mirror must change with it.
 *
 * Convention: DURATION is in SECONDS (motion/react convention). DELAY and
 * THRESHOLD are in ms/px (setTimeout + pointer math use those). `toMs()`
 * bridges seconds → CSS `transition:` strings.
 */

// ─────────────────────────────────────────────────────────────
// EASING — cubic-bezier control points, [x1, y1, x2, y2]
// ─────────────────────────────────────────────────────────────
export const EASE = {
  // General UI transitions — fast start, long gentle settle. Reads as
  // deliberate and "expensive" where symmetric ease-in-out reads robotic.
  standard: [0.32, 0.72, 0, 1],
  // Overshoot-and-settle for playful pops (badges, confirmations) only —
  // never chrome/panels, where bounce reads as instability.
  pop: [0.34, 1.56, 0.64, 1],
  // Things APPEARING (panels, popovers): pure decelerate into place, so the
  // element arrives softly instead of stopping abruptly.
  enter: [0, 0, 0.2, 1],
  // Things DISAPPEARING: accelerate out. Exits must be faster than the
  // matching entrance — lingering exits read as lag, not elegance.
  exit: [0.4, 0, 1, 1],
} as const

// ─────────────────────────────────────────────────────────────
// DURATION — seconds (motion/react convention)
// ─────────────────────────────────────────────────────────────
export const DURATION = {
  instant: 0.1, //  100ms — press feedback, checkbox toggles: fast enough to feel
  //                 tactile, slow enough that the change is actually visible.
  fast: 0.15, //    150ms — hover states, small transitions: under the ~200ms
  //                 threshold where users start perceiving "animation" vs "response".
  base: 0.2, //     200ms — default panel/dropdown transitions: the sweet spot
  //                 between abrupt and sluggish for mid-size surfaces.
  slow: 0.3, //     300ms — modals, larger surface transitions: bigger surfaces
  //                 need more time to read as moving, not teleporting.
  layout: 0.35, //  350ms — auto-layout FLIP reflow: layout shifts move more pixels,
  //                 so slightly longer matches the perceived settle of SPRING.content.
  stagger: 0.04, // 40ms — per-item stagger for panel content entering after its
  //                 container: enough to read as a cascade, not enough to feel slow.
} as const

// ─────────────────────────────────────────────────────────────
// SPRING — physics configs for motion/react `type: 'spring'`
// ─────────────────────────────────────────────────────────────
export const SPRING = {
  // Canvas CONTENT default — element animations, layout transitions, anything
  // ON the design surface. Energetic with a barely-perceptible settle: high
  // stiffness snaps to target, damping 30 stops it from wobbling.
  content: { type: 'spring', stiffness: 500, damping: 30, mass: 1 } as const,
  // UI CHROME default — panels, popovers, selection handles. Tighter and less
  // bouncy than content (lower mass, higher relative damping) because chrome
  // bounce reads as instability rather than playfulness.
  chrome: { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 } as const,
} as const

export const SPRING_PRESETS = {
  // Exposed to users in the Inspector's animation controls.
  // Matches SPRING.content — the app's own canvas default, so "Snappy" is
  // also "what the tool itself feels like".
  snappy: { stiffness: 500, damping: 30, mass: 1 },
  // Lower stiffness = slower approach; damping 25 keeps it overshoot-free —
  // the "gentle glide" option.
  smooth: { stiffness: 200, damping: 25, mass: 1 },
  // Deliberately underdamped (damping 12) so it visibly oscillates before
  // settling — the only preset where overshoot is the point.
  bouncy: { stiffness: 400, damping: 12, mass: 1 },
} as const

// ─────────────────────────────────────────────────────────────
// DELAY — milliseconds (setTimeout)
// ─────────────────────────────────────────────────────────────
export const DELAY = {
  tooltipShow: 400, // ms before a tooltip appears — faster feels twitchy on
  //                    incidental hovers, slower feels unresponsive when sought.
  tooltipHide: 0, //   tooltips vanish instantly; a lingering tooltip reads as lag.
  hoverIntent: 60, //  ms of sustained hover before a hover-state UI change fires —
  //                    prevents outline strobing when the mouse sweeps a dense canvas.
} as const

// ─────────────────────────────────────────────────────────────
// THRESHOLD — pixels / milliseconds / multipliers
// ─────────────────────────────────────────────────────────────
export const THRESHOLD = {
  dragStart: 4, //          px before a mousedown becomes a drag — without it, plain
  //                          clicks nudge elements by a pixel and feel broken.
  snapDistance: 6, //       px tolerance for smart-guide snapping — close enough to
  //                          feel magnetic, far enough not to fight free placement.
  resizeHandleHitArea: 8, // px invisible padding beyond the visible handle so
  //                          grabbing a resize handle never feels fiddly.
  doubleClickWindow: 300, // ms between clicks to register a double-click — the
  //                          OS-conventional default users' muscle memory expects.
  scrubMultiplierFine: 0.1, //  Cmd/Ctrl held while drag-scrubbing a value — 10x
  //                             precision for dialing in exact pixel values.
  scrubMultiplierCoarse: 10, // Shift held while drag-scrubbing — 10x speed for
  //                             covering large ranges without repeated drags.
} as const

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Seconds → "Nms" for CSS `transition:` strings. `toMs(DURATION.base)` → "200ms". */
export const toMs = (seconds: number) => `${Math.round(seconds * 1000)}ms`

/** cubic-bezier tuple → CSS `cubic-bezier(...)`. */
export const toCssBezier = (e: readonly [number, number, number, number]) =>
  `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`

/**
 * Ready-made motion/react `transition` configs so components don't reassemble
 * {duration, ease} by hand. Spread into a `transition` prop.
 */
export const TRANSITION = {
  ui: { duration: DURATION.base, ease: EASE.standard },
  enter: { duration: DURATION.fast, ease: EASE.enter },
  exit: { duration: DURATION.instant, ease: EASE.exit },
  press: { duration: DURATION.instant, ease: EASE.standard },
  springChrome: SPRING.chrome,
  springContent: SPRING.content,
} as const

/**
 * The canonical popover/dropdown/color-picker enter+exit for
 * AnimatePresence: scale+fade in together (either alone reads as cheap),
 * fade-only out (no scale reversal) and faster, per premium-UI convention.
 */
export const POPOVER_MOTION = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: TRANSITION.enter },
  exit: { opacity: 0, transition: TRANSITION.exit },
} as const

/** Toast/notification: rise + fade in, fall + fade out. Pure fades read unfinished. */
export const TOAST_MOTION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.enter } },
  exit: { opacity: 0, y: 6, transition: TRANSITION.exit },
} as const

export type SpringConfig = (typeof SPRING)[keyof typeof SPRING]
export type SpringPresetName = keyof typeof SPRING_PRESETS

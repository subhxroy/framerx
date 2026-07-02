/**
 * motionTokens — the ONE source of truth for every timing, easing, spring,
 * delay and threshold used for interaction/animation anywhere in the app.
 *
 * No component should hardcode a duration, easing curve, delay or px
 * threshold. Import from here instead. The values below are *reconciled*
 * with the existing tuned tokens in `src/index.css` (--duration-*, --ease-*)
 * so nothing that already feels right changes — this file mirrors those and
 * adds the layers that were missing (springs, delays, thresholds, and the
 * asymmetric enter/exit curves premium UIs use).
 *
 * Convention: DURATION is in SECONDS (motion/react + the earlier spec use
 * seconds). DELAY/THRESHOLD are in ms/px (setTimeout + pointer math use those).
 * `toMs()` bridges to CSS/`transition:` strings.
 */

// ─────────────────────────────────────────────────────────────
// EASING — cubic-bezier control points, [x1, y1, x2, y2]
// ─────────────────────────────────────────────────────────────
export const EASE = {
  // The app's signature curve — identical to --ease-ui in index.css. A
  // fast-out, gentle-settle decelerate that reads as "premium" rather than
  // the mechanical feel of ease-in-out. Default for most UI transitions.
  standard: [0.16, 1, 0.3, 1],
  // Overshoot-and-settle — identical to --ease-pop. Use sparingly for
  // playful pops (badges, tool confirmations), never for chrome/panels
  // where bounce reads as "unstable UI".
  pop: [0.34, 1.56, 0.64, 1],
  // Elements ENTERING the screen (panels opening, popovers appearing):
  // decelerate into place. Pairs with DURATION.fast/base.
  enter: [0, 0, 0.2, 1],
  // Elements LEAVING (panels closing, popovers dismissing): accelerate out.
  // Exits should be faster than entrances — a universal UX rule most apps
  // get wrong with symmetric timing. Pair with DURATION.instant.
  exit: [0.4, 0, 1, 1],
} as const

// ─────────────────────────────────────────────────────────────
// DURATION — seconds (motion/react convention)
// ─────────────────────────────────────────────────────────────
export const DURATION = {
  instant: 0.08, // 80ms — micro-feedback: button press, checkbox toggle, exits.
  //                 Mirrors --duration-fast; kept snappy so presses feel tactile.
  fast: 0.12, //    120ms — hover states, small UI transitions. Mirrors --duration-normal.
  base: 0.2, //     200ms — default for most UI (panels, dropdowns). Mirrors --duration-slow.
  slow: 0.3, //     300ms — larger surfaces (modal open, page transition). Long enough
  //                 to read as a deliberate surface change, short enough to stay responsive.
  layout: 0.35, //  350ms — auto-layout FLIP reflow. Slightly longer because layout shifts
  //                 move more pixels; matches the perceived settle of SPRING.snappy on content.
} as const

// ─────────────────────────────────────────────────────────────
// SPRING — physics configs for motion/react `type: 'spring'`
// ─────────────────────────────────────────────────────────────
export const SPRING = {
  // CANVAS / CONTENT default. Matches AnimatedElement.tsx so authored content
  // and system-driven canvas motion (selection glide) feel like one system.
  // Snappy with a barely-perceptible settle — energetic without wobbling.
  snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 1 } as const,
  // UI CHROME default — panels, popovers, tooltips. Tighter/less bouncy than
  // canvas content, because chrome overshoot reads as "unstable UI" rather
  // than "playful content".
  ui: { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 } as const,
} as const

// ─────────────────────────────────────────────────────────────
// DELAY — milliseconds (setTimeout)
// ─────────────────────────────────────────────────────────────
export const DELAY = {
  tooltipShow: 400, // ms before a tooltip appears on hover — faster feels twitchy,
  //                    slower feels unresponsive.
  tooltipHide: 0, //   tooltips disappear instantly; lingering reads as laggy.
  hoverIntent: 60, //  ms of continuous hover before a hover-state UI change fires.
  //                    Prevents outline strobing when the mouse sweeps a dense canvas.
} as const

// ─────────────────────────────────────────────────────────────
// THRESHOLD — pixels / milliseconds
// ─────────────────────────────────────────────────────────────
export const THRESHOLD = {
  dragStart: 4, //          px of movement before a mousedown becomes a drag rather
  //                          than a click — without it, clicks nudge elements by 1px
  //                          and feel broken.
  snapDistance: 6, //       px tolerance for smart-guide snapping.
  resizeHandleHitArea: 8, // px — visible handle can be 8×8 but the hit area extends
  //                          this far past it so resizing never feels fiddly.
  doubleClickWindow: 300, // ms between clicks to register as a double-click.
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
  springUi: SPRING.ui,
  springSnappy: SPRING.snappy,
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

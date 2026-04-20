/**
 * Splash visual theme — aqua / cyan / deep-blue palette evoking waves and droplets.
 * Everything that prints to the console goes through here for a consistent look.
 */

// ─── ANSI color primitives ───────────────────────────────────────────────────

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";

const rgb = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
const bgRgb = (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`;

// ─── Splash brand palette (water/aqua) ──────────────────────────────────────

export const C = {
  /** Deep ocean — headlines, borders */
  blue: rgb(14, 116, 144),     // #0E7490 teal-700
  /** Aqua — primary accent */
  sky: rgb(34, 211, 238),      // #22D3EE cyan-400
  /** Light spray — secondary accent */
  skyLight: rgb(165, 243, 252),// #A5F3FC cyan-200
  /** Pure white — crest foam */
  white: rgb(255, 255, 255),
  /** Soft white */
  softWhite: rgb(226, 232, 240),
  /** Muted slate */
  muted: rgb(148, 163, 184),
  subtle: rgb(100, 116, 139),

  success: rgb(34, 197, 94),
  warning: rgb(251, 191, 36),
  error: rgb(239, 68, 68),

  bgBlue: bgRgb(14, 116, 144),
  bgSky: bgRgb(34, 211, 238),
};

// ─── Icons ──────────────────────────────────────────────────────────────────

export const I = {
  check: "✓",
  cross: "✗",
  warn: "⚠",
  info: "ℹ",
  bullet: "•",
  arrow: "→",
  chevron: "›",

  dot: "●",
  circle: "○",
  square: "▣",
  diamond: "◆",

  /** Droplet — the Splash mascot */
  drop: "💧",
  /** Wave */
  wave: "≈",
};

// ─── style helpers ──────────────────────────────────────────────────────────

export const style = {
  blue: (s: string) => `${C.blue}${s}${RESET}`,
  sky: (s: string) => `${C.sky}${s}${RESET}`,
  skyLight: (s: string) => `${C.skyLight}${s}${RESET}`,
  white: (s: string) => `${C.white}${s}${RESET}`,
  softWhite: (s: string) => `${C.softWhite}${s}${RESET}`,
  muted: (s: string) => `${C.muted}${s}${RESET}`,
  subtle: (s: string) => `${C.subtle}${s}${RESET}`,

  success: (s: string) => `${C.success}${s}${RESET}`,
  warning: (s: string) => `${C.warning}${s}${RESET}`,
  error: (s: string) => `${C.error}${s}${RESET}`,

  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  italic: (s: string) => `${ITALIC}${s}${RESET}`,

  heading: (s: string) => `${BOLD}${C.sky}${s}${RESET}`,
  badge: (s: string) => `${C.bgBlue}${C.white}${BOLD} ${s} ${RESET}`,
};

// ─── Banner ──────────────────────────────────────────────────────────────────

/**
 * Splash brand banner — block-letter SPLASH with aqua gradient and wave framing.
 */
export function renderBanner(opts?: { subtitle?: string; compact?: boolean }): string {
  const { subtitle = "Autonomous Agent Platform", compact = false } = opts || {};

  if (compact) {
    return [
      "",
      `  ${style.heading("Splash")} ${style.subtle("·")} ${style.softWhite(subtitle)}`,
      "",
    ].join("\n");
  }

  // Gradient stops: deep teal → aqua → sky foam
  const gradient = (line: string): string => {
    const len = line.length;
    let out = "";
    for (let i = 0; i < len; i++) {
      const char = line[i]!;
      const t = i / Math.max(len - 1, 1);
      let r, g, b;
      if (t < 0.5) {
        const t2 = t / 0.5;
        r = Math.round(14 + (34 - 14) * t2);
        g = Math.round(116 + (211 - 116) * t2);
        b = Math.round(144 + (238 - 144) * t2);
      } else {
        const t2 = (t - 0.5) / 0.5;
        r = Math.round(34 + (165 - 34) * t2);
        g = Math.round(211 + (243 - 211) * t2);
        b = Math.round(238 + (252 - 238) * t2);
      }
      out += `\x1b[38;2;${r};${g};${b}m${char}`;
    }
    return out + RESET;
  };

  const logo = [
    "   ███████╗██████╗ ██╗      █████╗ ███████╗██╗  ██╗",
    "   ██╔════╝██╔══██╗██║     ██╔══██╗██╔════╝██║  ██║",
    "   ███████╗██████╔╝██║     ███████║███████╗███████║",
    "   ╚════██║██╔═══╝ ██║     ██╔══██║╚════██║██╔══██║",
    "   ███████║██║     ███████╗██║  ██║███████║██║  ██║",
    "   ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
  ];

  const wave =
    "≈≈≈   ~  ∿   ≈    ∿  ~   ≈≈  ∿  ~  ≈  ∿   ~ ≈≈≈";

  const terminalWidth = process.stdout.columns || 80;
  const logoWidth = 53;
  const leftPadCount = Math.max(0, Math.floor((terminalWidth - logoWidth) / 2));
  const pad = " ".repeat(leftPadCount);

  const titleStrip = `${style.sky("≈".repeat(10))}  💧 ${style.bold(style.white(subtitle))} 💧  ${style.sky("≈".repeat(10))}`;
  const rawTitleLen = 20 + 6 + subtitle.length + 6;
  const titlePadCount = Math.max(0, Math.floor((terminalWidth - rawTitleLen) / 2));
  const titlePad = " ".repeat(titlePadCount);

  const wavePad = " ".repeat(Math.max(0, Math.floor((terminalWidth - wave.length) / 2)));

  const lines = [
    "",
    wavePad + style.skyLight(wave),
    ...logo.map((l) => pad + gradient(l)),
    wavePad + style.sky(wave),
    "",
    titlePad + titleStrip,
    "",
  ];

  return lines.join("\n");
}

// ─── Section helpers ────────────────────────────────────────────────────────

export function section(title: string): string {
  return `\n${style.heading(`${I.diamond} ${title}`)}\n${style.sky("─".repeat(Math.min(title.length + 4, 60)))}`;
}

export function kv(key: string, value: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.sky(key.padEnd(12))} ${style.softWhite(value)}`;
}

export function bullet(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.sky(I.bullet)} ${style.softWhite(text)}`;
}

export function ok(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.success(I.check)} ${style.softWhite(text)}`;
}

export function warn(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.warning(I.warn)} ${style.softWhite(text)}`;
}

export function bad(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.error(I.cross)} ${style.softWhite(text)}`;
}

// ─── Animation ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function skipAnim(): boolean {
  return (
    !process.stdout.isTTY ||
    process.env.CI === "true" ||
    !!process.env.NO_COLOR ||
    process.env.SPLASH_NO_ANIM === "1" ||
    process.env.ALPCLAW_NO_ANIM === "1"
  );
}

/**
 * Typewriter-reveal the Splash banner one line at a time.
 */
export async function animateBanner(opts?: {
  subtitle?: string;
  lineDelayMs?: number;
}): Promise<void> {
  const { subtitle, lineDelayMs = 45 } = opts || {};
  const banner = renderBanner({ subtitle });

  if (skipAnim()) {
    process.stdout.write(banner + "\n");
    return;
  }

  const lines = banner.split("\n");
  for (const line of lines) {
    process.stdout.write(line + "\n");
    if (line.trim().length > 0) await sleep(lineDelayMs);
  }
}

/**
 * Pulsing Splash wordmark — good for post-banner flair.
 */
export async function pulseWordmark(word: string = "Splash", cycles: number = 2): Promise<void> {
  if (skipAnim()) return;
  const palette = [C.sky, C.skyLight, C.white, C.skyLight, C.sky, C.blue];
  for (let c = 0; c < cycles; c++) {
    for (const color of palette) {
      process.stdout.write(`\r  ${color}${BOLD}${word}${RESET}`);
      await sleep(80);
    }
  }
  process.stdout.write(`\r  ${style.heading(word)}\n`);
}

// ─── Loading animations ─────────────────────────────────────────────────────

/** Braille spinner frames — smooth circular motion. */
export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Droplet loader frames — playful water-themed. */
export const DROP_FRAMES = ["💧 ", " 💧", "  💧", "   💧", "💦", "💧💧", "💧"];

/** Wave loader frames. */
export const WAVE_FRAMES = [
  "[≈     ]",
  "[ ≈≈    ]",
  "[  ≈≈≈  ]",
  "[   ≈≈≈≈]",
  "[    ≈≈≈]",
  "[     ≈≈]",
  "[      ≈]",
  "[       ]",
];

export interface LoaderHandle {
  stop(finalText?: string): void;
  update(text: string): void;
}

/**
 * Start a frame-animated loader on stdout. Non-TTY → prints once and no-op.
 */
export function startLoader(
  text: string,
  opts?: { frames?: string[]; intervalMs?: number; color?: (s: string) => string },
): LoaderHandle {
  const frames = opts?.frames || SPINNER_FRAMES;
  const interval = opts?.intervalMs || 80;
  const color = opts?.color || style.sky;
  let msg = text;

  if (skipAnim()) {
    process.stdout.write(`${color("…")} ${msg}\n`);
    return {
      stop: (final?: string) => {
        if (final) process.stdout.write(`${final}\n`);
      },
      update: (t: string) => { msg = t; },
    };
  }

  let frame = 0;
  let stopped = false;
  const render = () => {
    if (stopped) return;
    const f = frames[frame % frames.length]!;
    process.stdout.write(`\r${color(f)} ${msg}   \x1b[K`);
    frame++;
  };
  render();
  const timer = setInterval(render, interval);

  return {
    stop(final?: string) {
      stopped = true;
      clearInterval(timer);
      process.stdout.write(`\r\x1b[K`);
      if (final) process.stdout.write(`${final}\n`);
    },
    update(t: string) {
      msg = t;
    },
  };
}

/** Quick helper to print a droplet splash "ripple" effect as a heading. */
export async function ripple(text: string): Promise<void> {
  if (skipAnim()) {
    console.log(style.heading(`💧 ${text}`));
    return;
  }
  const widths = [1, 3, 5, 7, 5, 3, 1];
  for (const w of widths) {
    const dots = style.skyLight("(" + "≈".repeat(w) + ")");
    process.stdout.write(`\r  ${dots} ${style.heading(text)}   \x1b[K`);
    await sleep(60);
  }
  process.stdout.write("\n");
}

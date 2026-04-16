/**
 * AlpClaw visual theme — blue, skyblue, white palette.
 * Everything that prints to the console goes through here for a consistent look.
 */

// ─── ANSI color primitives ───────────────────────────────────────────────────

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";

// True-color RGB escapes — works in all modern terminals
const rgb = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
const bgRgb = (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`;

// ─── AlpClaw brand palette ───────────────────────────────────────────────────

export const C = {
  /** Deep brand blue — headlines, borders */
  blue: rgb(37, 99, 235), // #2563EB
  /** Sky blue — primary accent, active state */
  sky: rgb(56, 189, 248), // #38BDF8
  /** Light sky — secondary accent, hover */
  skyLight: rgb(125, 211, 252), // #7DD3FC
  /** Pure white — primary text */
  white: rgb(255, 255, 255),
  /** Soft white — body text */
  softWhite: rgb(226, 232, 240), // slate-200
  /** Muted gray — metadata, timestamps */
  muted: rgb(148, 163, 184), // slate-400
  /** Subtle — least important */
  subtle: rgb(100, 116, 139), // slate-500

  /** Status colors — still keep semantic colors */
  success: rgb(34, 197, 94),
  warning: rgb(251, 191, 36),
  error: rgb(239, 68, 68),

  /** Backgrounds for banners/badges */
  bgBlue: bgRgb(37, 99, 235),
  bgSky: bgRgb(56, 189, 248),
};

// ─── Icons — consistent across the CLI ──────────────────────────────────────

export const I = {
  // Status
  check: "✓",
  cross: "✗",
  warn: "⚠",
  info: "ℹ",
  bullet: "•",
  arrow: "→",
  chevron: "›",

  // Progress
  dot: "●",
  circle: "○",
  spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],

  // Phases
  brain: "◆",
  tool: "⚡",
  sparkle: "✦",
  diamond: "◇",

  // Structural
  corner: "└",
  branch: "├",
  pipe: "│",
  dash: "─",
};

// ─── Styling helpers ─────────────────────────────────────────────────────────

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

  /** Brand-styled header: bold sky-blue */
  heading: (s: string) => `${BOLD}${C.sky}${s}${RESET}`,
  /** Sky-blue on blue background badge */
  badge: (s: string) => `${C.bgBlue}${C.white}${BOLD} ${s} ${RESET}`,
};

// ─── Banner ──────────────────────────────────────────────────────────────────

import pc from "picocolors";

// ─── Banner ──────────────────────────────────────────────────────────────────

/**
 * AlpClaw brand banner — incredibly stylish ASCII logo mapped with a truecolor gradient.
 */
export function renderBanner(opts?: { subtitle?: string; compact?: boolean }): string {
  const { subtitle = "Autonomous Agent Platform", compact = false } = opts || {};

  if (compact) {
    return [
      "",
      `  ${style.heading("AlpClaw")} ${style.subtle("·")} ${style.softWhite(subtitle)}`,
      "",
    ].join("\n");
  }

  // Gradient: Deep Fuchsia -> Violet -> Brand Blue -> Sky Blue
  const gradient = (line: string): string => {
    const len = line.length;
    let out = "";
    for (let i = 0; i < len; i++) {
      const char = line[i]!;
      const t = i / Math.max(len - 1, 1);

      // Color stops for a gorgeous Cyberpunk sunset glow
      let r, g, b;
      if (t < 0.33) {
        // Fuchsia (217, 70, 239) to Violet (139, 92, 246)
        const t2 = t / 0.33;
        r = Math.round(217 + (139 - 217) * t2);
        g = Math.round(70 + (92 - 70) * t2);
        b = Math.round(239 + (246 - 239) * t2);
      } else if (t < 0.66) {
        // Violet (139, 92, 246) to Brand Blue (37, 99, 235)
        const t2 = (t - 0.33) / 0.33;
        r = Math.round(139 + (37 - 139) * t2);
        g = Math.round(92 + (99 - 92) * t2);
        b = Math.round(246 + (235 - 246) * t2);
      } else {
        // Brand Blue (37, 99, 235) to Sky Blue (56, 189, 248)
        const t2 = (t - 0.66) / 0.34;
        r = Math.round(37 + (56 - 37) * t2);
        g = Math.round(99 + (189 - 99) * t2);
        b = Math.round(235 + (248 - 235) * t2);
      }
      out += `\x1b[38;2;${r};${g};${b}m${char}`;
    }
    return out + RESET;
  };

  const logo = [
    "      ▄▄▄       ██▓     ██▓███   ▄████▄   ██▓    ▄▄▄       █     █░",
    "     ▒████▄    ▓██▒    ▓██░  ██▒▒██▀ ▀█  ▓██▒   ▒████▄    ▓█░ █ ░█░",
    "     ▒██  ▀█▄  ▒██░    ▓██░ ██▓▒▒▓█    ▄ ▒██░   ▒██  ▀█▄  ▒█░ █ ░█ ",
    "     ░██▄▄▄▄██ ▒██░    ▒██▄█▓▒ ▒▒▓▓▄ ▄██▒▒██░   ░██▄▄▄▄██ ░█░ █ ░█ ",
    "      ▓█   ▓██▒░██████▒▒██▒ ░  ░▒ ▓███▀ ░░██████▒▓█   ▓██▒░░██▒██▓ ",
    "      ▒▒   ▓▒█░░ ▒░▓  ░▒▓▒░ ░  ░░ ░▒ ▒  ░░ ▒░▓  ░▒▒   ▓▒█░░ ▓░▒ ▒  ",
    "       ▒   ▒▒ ░░ ░ ▒  ░░▒ ░       ░  ▒   ░ ░ ▒  ░ ▒   ▒▒ ░  ▒ ░ ░  ",
    "       ░   ▒     ░ ░   ░░       ░          ░ ░    ░   ▒     ░   ░  ",
    "           ░  ░    ░  ░         ░ ░          ░  ░     ░  ░    ░    ",
    "                                ░                                  ",
  ];

  const terminalWidth = process.stdout.columns || 80;
  
  // Calculate padding to exactly center the 67-character wide logo block
  const logoWidth = 67;
  const leftPadCount = Math.max(0, Math.floor((terminalWidth - logoWidth) / 2));
  const pad = " ".repeat(leftPadCount);

  // Center the subtitle as well
  const titleStrip = `${style.sky("⎯".repeat(15))}  ${style.bold(style.white(subtitle))}  ${style.sky("⎯".repeat(15))}`;
  const rawTitleStripLen = 30 + 4 + subtitle.length; // 15 dashes * 2 + 4 spaces + text
  const titlePadCount = Math.max(0, Math.floor((terminalWidth - rawTitleStripLen) / 2));
  const titlePad = " ".repeat(titlePadCount);

  const lines = [
    "",
    ...logo.map((l) => pad + gradient(l)),
    titlePad + titleStrip,
    "",
  ];

  return lines.join("\n");
}

// ─── Section helpers ─────────────────────────────────────────────────────────

/** Print a section header with a blue rule. */
export function section(title: string): string {
  return `\n${style.heading(`${I.diamond} ${title}`)}\n${style.sky("─".repeat(Math.min(title.length + 4, 60)))}`;
}

/** Print a key-value line in blue/white. */
export function kv(key: string, value: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.sky(key.padEnd(12))} ${style.softWhite(value)}`;
}

/** Print a bullet item. */
export function bullet(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.sky(I.bullet)} ${style.softWhite(text)}`;
}

/** Print a success line. */
export function ok(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.success(I.check)} ${style.softWhite(text)}`;
}

/** Print a warn line. */
export function warn(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.warning(I.warn)} ${style.softWhite(text)}`;
}

/** Print an error line. */
export function bad(text: string, indent: number = 2): string {
  const pad = " ".repeat(indent);
  return `${pad}${style.error(I.cross)} ${style.softWhite(text)}`;
}

// ─── Animated banner ────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Typewriter-reveal the AlpClaw banner one line at a time.
 *
 * Respects CI / NO_COLOR / non-TTY environments — falls back to a single
 * synchronous print so pipes and logs stay clean.
 */
export async function animateBanner(opts?: {
  subtitle?: string;
  lineDelayMs?: number;
}): Promise<void> {
  const { subtitle, lineDelayMs = 45 } = opts || {};
  const banner = renderBanner({ subtitle });

  const skipAnim =
    !process.stdout.isTTY ||
    process.env.CI === "true" ||
    process.env.NO_COLOR ||
    process.env.ALPCLAW_NO_ANIM === "1";

  if (skipAnim) {
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
 * Short spinning pulse of the word "AlpClaw" — good for post-banner flair.
 */
export async function pulseWordmark(word: string = "AlpClaw", cycles: number = 2): Promise<void> {
  if (!process.stdout.isTTY || process.env.ALPCLAW_NO_ANIM === "1") return;
  const palette = [C.sky, C.skyLight, C.white, C.skyLight, C.sky, C.blue];
  for (let c = 0; c < cycles; c++) {
    for (const color of palette) {
      process.stdout.write(`\r  ${color}${BOLD}${word}${RESET}`);
      await sleep(80);
    }
  }
  process.stdout.write(`\r  ${style.heading(word)}\n`);
}

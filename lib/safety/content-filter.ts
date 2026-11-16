/**
 * Content Moderation & SafeSearch Filter
 * Blocks NSFW, adult, sexually explicit, and vulgar search terms.
 */

// List of exact words or regex patterns that must match with word boundaries
const RESTRICTED_PATTERNS: RegExp[] = [
  // Explicit & Adult
  /\b(porn|porno|pornography|pornographic|nsfw|xxx|hardcore|softcore)\b/i,
  /\b(erotic|erotica|fetish|bdsm|hentai|ecchi|rule34)\b/i,

  // Nudity & Exposure
  /\b(nude|nudes|nudity|naked|nudist|strip|stripper|stripping|topless|bottomless)\b/i,
  /\b(exposed|undressed|bare|unclad)\s+(body|breasts|chest|woman|man|girl|boy)\b/i,

  // Sexual Acts & Terms (with boundary to avoid "unisex", "sussex", "essex", etc.)
  /\b(sex|sexy|sexual|sexuality|intercourse|copulation|fornication)\b/i,
  /\b(blowjob|handjob|fellatio|cunnilingus|deepthroat|creampie|gangbang)\b/i,
  /\b(masturbate|masturbating|masturbation|orgasm|ejaculation|climax)\b/i,
  /\b(escort|prostitute|prostitution|hooker|brothel|onlyfans)\b/i,
  /\b(milf|dildo|vibrator|lingerie|thong|playboy|penthouse)\b/i,

  // Anatomy / Vulgar slang (guarded with boundaries)
  /\b(penis|phallus|cock|dick|dicks)\b/i,
  /\b(vagina|vulva|pussy|pussies|clitoris|clit|cunt|cunts)\b/i,
  /\b(boob|boobs|boobies|tits|titties|breasts?|areola|nipple|nipples)\b/i,
  /\b(asshole|butt|butts|booty|anus|anal)\b/i,
  /\b(genital|genitals|genitalia|pubic|groin)\b/i,

  // Profanity & Slurs
  /\b(fuck|fucker|fucking|shit|bitch|bastard|whore|slut)\b/i,
];

/**
 * Normalizes input string to prevent obfuscation (e.g. "s-e-x", "n.u.d.e", "p 0 r n")
 */
function normalizeText(text: string): string {
  if (!text) return "";
  let normalized = text.toLowerCase();

  // Replace common leetspeak substitutions
  normalized = normalized
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");

  return normalized;
}

/**
 * Checks if a search query or title contains disallowed/NSFW content.
 * Returns { isDisallowed: boolean, reason?: string }
 */
export function checkContentSafety(input: string): { isDisallowed: boolean; reason?: string } {
  if (!input || typeof input !== "string") {
    return { isDisallowed: false };
  }

  const raw = input.trim();
  const normalized = normalizeText(raw);

  // Check against raw and normalized text
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(raw) || pattern.test(normalized)) {
      return {
        isDisallowed: true,
        reason: "Search contains restricted adult or inappropriate keywords.",
      };
    }
  }

  // Also check without spaces/punctuation for sneaky bypasses (e.g., "n u d e", "p.o.r.n")
  const collapsed = normalized.replace(/[^a-z]/g, "");
  const collapsedBlockedWords = [
    "porn",
    "porno",
    "nsfw",
    "nude",
    "nudes",
    "nudity",
    "naked",
    "topless",
    "blowjob",
    "handjob",
    "vagina",
    "penis",
    "boobs",
    "boobies",
    "onlyfans",
  ];

  for (const word of collapsedBlockedWords) {
    if (collapsed.includes(word)) {
      return {
        isDisallowed: true,
        reason: "Search contains restricted adult or inappropriate keywords.",
      };
    }
  }

  return { isDisallowed: false };
}

export function isDisallowedContent(input: string): boolean {
  return checkContentSafety(input).isDisallowed;
}

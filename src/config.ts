import "dotenv/config";

// ─── Telegram ─────────────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in .env");
}

// ─── InstantDB ────────────────────────────────────────────────────────────────
const INSTANT_APP_ID = process.env.INSTANT_APP_ID as string;
const INSTANT_ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN as string;
if (!INSTANT_APP_ID || !INSTANT_ADMIN_TOKEN) {
  throw new Error("INSTANT_APP_ID and INSTANT_ADMIN_TOKEN must be set in .env");
}

// ─── Telegram username → Person name mapping ─────────────────────────────────
// Map each person's Telegram username (without @) to their payment name.
// Only these users are allowed to interact with the bot.
const TELEGRAM_USERNAME_MAP: Record<string, "Nhan" | "Thuong" | "Dung"> = {
  // TODO: Replace with actual Telegram usernames (without @)
  [process.env.TELEGRAM_USERNAME_NHAN || ""]: "Nhan",
  [process.env.TELEGRAM_USERNAME_THUONG || ""]: "Thuong",
  [process.env.TELEGRAM_USERNAME_DUNG || ""]: "Dung",
};

// Remove empty-string entries
Object.keys(TELEGRAM_USERNAME_MAP).forEach((key) => {
  if (key === "") delete TELEGRAM_USERNAME_MAP[key];
});

export const ALLOWED_NAMES = ["Nhan", "Thuong", "Dung"] as const;
export type AllowedName = (typeof ALLOWED_NAMES)[number];

export function getPersonNameFromTelegramUsername(
  username: string | undefined
): AllowedName | null {
  if (!username) return null;
  return TELEGRAM_USERNAME_MAP[username] ?? null;
}

export { TELEGRAM_BOT_TOKEN, INSTANT_APP_ID, INSTANT_ADMIN_TOKEN };

import { Bot } from "grammy";
import { ALLOWED_NAMES } from "../config";

const HELP_TEXT = `
**Payment Bot Commands**

\`/start\` - Welcome message
\`/help\`  - Show this help message

**Record a payment:**
\`/pay Nhan-5-Breakfast\`
Splits: name (${ALLOWED_NAMES.join("|")}) - money (stored as x) - explanation

**Edit a payment:**
\`/edit <uuid>-Nhan-5-Updated desc\`
First arg is the UUID from /pay response.

**Delete a payment:**
\`/delete <uuid>\`
Soft-deletes the record.

**Monthly summary:**
\`/summarize 2025-3\`
Shows total spent, per-person share, and who transfers to whom.
`.trim();

export function registerHelpHandler(bot: Bot) {
  bot.command(["help", "start"], async (ctx) => {
    const from = ctx.from;
    console.log(`[${new Date().toISOString()}] /start or /help from ${from?.username ?? "unknown"} (${from?.first_name ?? ""} ${from?.last_name ?? ""}) | chat: ${ctx.chat.id}`);
    await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
  });
}

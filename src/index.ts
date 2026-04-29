import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./config";
import { registerHelpHandler } from "./handlers/help";
import { registerPayHandler } from "./handlers/pay";
import { registerEditHandler } from "./handlers/edit";
import { registerDeleteHandler } from "./handlers/delete";
import { registerSummarizeHandler } from "./handlers/summarize";

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Register handlers
registerHelpHandler(bot);
registerPayHandler(bot);
registerEditHandler(bot);
registerDeleteHandler(bot);
registerSummarizeHandler(bot);

// Global error handler
bot.catch((err) => {
  console.error("[ERROR] Bot error:", err);
});

// Log all incoming message updates
bot.on("message", (ctx) => {
  const from = ctx.from;
  console.log(`[MSG] from ${from?.username ?? "unknown"} | text: ${ctx.message.text ?? "(non-text)"}`);
});

console.log("🤖 Payment bot is starting...");
bot.start();
console.log("✅ Bot is running. Press Ctrl+C to stop.");

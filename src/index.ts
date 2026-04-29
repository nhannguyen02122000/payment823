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

// Register bot commands for Telegram autocomplete suggestions
(async () => {
  await bot.api.setMyCommands([
  { command: "help", description: "Show help message" },
  { command: "pay", description: "Record a payment (name-money-explanation)" },
  { command: "edit", description: "Edit a payment by UUID" },
  { command: "delete", description: "Delete a payment by UUID" },
  { command: "summarize", description: "Monthly spending summary (year-month)" },
]);
})();

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

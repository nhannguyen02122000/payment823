import { Bot, GrammyError } from "grammy";
import { ALLOWED_NAMES, getPersonNameFromTelegramUsername } from "../config";
import { createPayment } from "../db";

export function registerPayHandler(bot: Bot) {
  bot.command("pay", async (ctx) => {
    const username = ctx.msg?.from?.username;
    const person = getPersonNameFromTelegramUsername(username);

    if (!person) {
      await ctx.reply(
        `❌ Your Telegram username (@${username || "unknown"}) is not registered.\n` +
          "Ask the admin to add your username to the bot config."
      );
      return;
    }

    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply(
        `❌ Usage: /pay name-money-explanation\n` +
          `  name: ${ALLOWED_NAMES.join(", ")}\n` +
          `  money: number (stored as-is, displayed as ×1000 VND)\n` +
          `  explanation: optional text\n` +
          `Example: /pay Nhan-5-Breakfast`
      );
      return;
    }

    // Parse name-money-explanation (split by '-')
    const parts = raw.split("-");
    if (parts.length < 2) {
      await ctx.reply(
        "❌ Invalid format. Use: /pay name-money-explanation\n" +
          "Example: /pay Nhan-5-Breakfast"
      );
      return;
    }

    const [inputName, moneyStr, ...descParts] = parts;
    const name = inputName.trim();
    const description = descParts.join("-").trim() || undefined;

    // Validate name
    if (!ALLOWED_NAMES.includes(name as (typeof ALLOWED_NAMES)[number])) {
      await ctx.reply(
        `❌ Invalid name "${name}". Allowed: ${ALLOWED_NAMES.join(", ")}`
      );
      return;
    }

    // Validate money
    const money = parseInt(moneyStr.trim(), 10);
    if (isNaN(money)) {
      await ctx.reply("❌ Money must be a valid number.");
      return;
    }

    try {
      const result = await createPayment({
        name,
        money,
        description,
        createdBy: username!,
      });

      await ctx.reply(
        `✅ Payment recorded!\n` +
          `  Name: ${name}\n` +
          `  Amount: ${result.formattedMoney}\n` +
          `  Description: ${description ?? "-"}\n` +
          `  UUID: \`${result.id}\``,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("[/pay] Error:", err);
      const message =
        err instanceof GrammyError
          ? `Telegram error: ${err.message}`
          : "Failed to save payment. Check server logs.";
      await ctx.reply(`❌ ${message}`);
    }
  });
}

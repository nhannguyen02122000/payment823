import { Bot, GrammyError } from "grammy";
import { ALLOWED_NAMES, getPersonNameFromTelegramUsername } from "../config";
import { updatePayment } from "../db";

export function registerEditHandler(bot: Bot) {
  bot.command("edit", async (ctx) => {
    const username = ctx.msg?.from?.username;
    const person = getPersonNameFromTelegramUsername(username);

    if (!person) {
      await ctx.reply(
        `❌ Your Telegram username (@${username || "unknown"}) is not registered.`
      );
      return;
    }

    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply(
        `❌ Usage: /edit uuid-name-money-explanation\n` +
          `Example: /edit abc123-Nhan-5-Updated breakfast`
      );
      return;
    }

    // Parse uuid-name-money-explanation (first '-' is uuid-end marker)
    const colonIdx = raw.indexOf("-");
    if (colonIdx === -1) {
      await ctx.reply("❌ Invalid format. Use: /edit uuid-name-money-explanation");
      return;
    }

    const rest = raw.slice(colonIdx + 1);
    const spaceIdx = rest.indexOf("-");
    if (spaceIdx === -1) {
      await ctx.reply("❌ Invalid format. Need at least uuid-name-money.");
      return;
    }

    const uuid = raw.slice(0, colonIdx).trim();
    const restAfterUuid = rest.slice(spaceIdx + 1);
    const nextDashIdx = restAfterUuid.indexOf("-");

    let name: string, moneyStr: string, description: string | undefined;

    if (nextDashIdx === -1) {
      // No description: uuid-name-money
      name = rest.slice(0, spaceIdx).trim();
      moneyStr = restAfterUuid.trim();
    } else {
      // uuid-name-money-explanation
      name = rest.slice(0, spaceIdx).trim();
      moneyStr = restAfterUuid.slice(0, nextDashIdx).trim();
      description = restAfterUuid.slice(nextDashIdx + 1).trim() || undefined;
    }

    if (!ALLOWED_NAMES.includes(name as (typeof ALLOWED_NAMES)[number])) {
      await ctx.reply(
        `❌ Invalid name "${name}". Allowed: ${ALLOWED_NAMES.join(", ")}`
      );
      return;
    }

    const money = parseInt(moneyStr, 10);
    if (isNaN(money)) {
      await ctx.reply("❌ Money must be a valid number.");
      return;
    }

    try {
      const result = await updatePayment({
        id: uuid,
        name,
        money,
        description,
        updatedBy: username!,
      });

      if (!result.success) {
        await ctx.reply(
          `❌ Payment with UUID "${uuid}" not found or already deleted.`
        );
        return;
      }

      await ctx.reply(
        `✏️ Payment updated!\n` +
          `  UUID: \`${uuid}\`\n` +
          `  Name: ${name}\n` +
          `  Amount: ${result.formattedMoney}\n` +
          `  Description: ${description ?? "-"}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("[/edit] Error:", err);
      const message =
        err instanceof GrammyError
          ? `Telegram error: ${err.message}`
          : "Failed to update payment.";
      await ctx.reply(`❌ ${message}`);
    }
  });
}

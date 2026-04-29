import { Bot, GrammyError } from "grammy";
import { getPersonNameFromTelegramUsername } from "../config";
import { softDeletePayment } from "../db";

export function registerDeleteHandler(bot: Bot) {
  bot.command("delete", async (ctx) => {
    const username = ctx.msg?.from?.username;
    if (!getPersonNameFromTelegramUsername(username)) {
      await ctx.reply(
        `❌ Your Telegram username (@${username || "unknown"}) is not registered.`
      );
      return;
    }

    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply("❌ Usage: /delete <uuid>\nExample: /delete abc123");
      return;
    }

    const uuid = raw.trim();

    try {
      const success = await softDeletePayment({ id: uuid, updatedBy: username! });

      if (!success) {
        await ctx.reply(
          `❌ Payment with UUID "${uuid}" not found or already deleted.`
        );
        return;
      }

      await ctx.reply(`🗑️ Payment deleted (soft delete).\nUUID: \`${uuid}\``, {
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error("[/delete] Error:", err);
      const message =
        err instanceof GrammyError
          ? `Telegram error: ${err.message}`
          : "Failed to delete payment.";
      await ctx.reply(`❌ ${message}`);
    }
  });
}

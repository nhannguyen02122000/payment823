import { Bot, GrammyError } from "grammy";
import { getPersonNameFromTelegramUsername } from "../config";
import { queryPaymentsByMonth, formatMoney, ALLOWED_NAMES } from "../db";

export function registerSummarizeHandler(bot: Bot) {
  bot.command("summarize", async (ctx) => {
    const username = ctx.msg?.from?.username;
    if (!getPersonNameFromTelegramUsername(username)) {
      await ctx.reply(
        `❌ Your Telegram username (@${username || "unknown"}) is not registered.`
      );
      return;
    }

    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply(
        "❌ Usage: /summarize year-month\nExample: /summarize 2025-3"
      );
      return;
    }

    // Parse year-month
    const parts = raw.split("-");
    if (parts.length !== 2) {
      await ctx.reply(
        "❌ Invalid format. Use: /summarize year-month\nExample: /summarize 2025-3"
      );
      return;
    }

    const year = parseInt(parts[0].trim(), 10);
    const month = parseInt(parts[1].trim(), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      await ctx.reply(
        "❌ Invalid year or month. Month must be 1–12.\nExample: /summarize 2025-3"
      );
      return;
    }

    try {
      const payments = await queryPaymentsByMonth(year, month);

      // Group by name
      const moneySpentPerPerson: Record<string, number> = {};
      for (const name of ALLOWED_NAMES) {
        moneySpentPerPerson[name] = 0;
      }
      for (const p of payments) {
        moneySpentPerPerson[p.name] = (moneySpentPerPerson[p.name] || 0) + p.money;
      }

      // Total money spent
      const totalMoneySpent = Object.values(moneySpentPerPerson).reduce(
        (sum, m) => sum + m,
        0
      );

      // How many unique names have records
      const namesWithRecords = Object.entries(moneySpentPerPerson).filter(
        ([, m]) => m > 0
      ).length;
      const perPersonShare =
        namesWithRecords > 0 ? Math.floor(totalMoneySpent / namesWithRecords) : 0;

      // Format spending per person
      const spendingLines = Object.entries(moneySpentPerPerson)
        .filter(([, m]) => m > 0)
        .map(([name, m]) => `${name}: ${formatMoney(m)}`)
        .join("\n");

      // Who should transfer to/from Nhan
      const transfersToNhan: string[] = [];
      const nhanShouldTransfer: string[] = [];

      for (const [name, spent] of Object.entries(moneySpentPerPerson)) {
        if (name === "Nhan" || spent === 0) continue;

        const diff = perPersonShare - spent;
        if (diff > 0) {
          // This person should pay Nhan
          transfersToNhan.push(`${name}: ${formatMoney(diff)}`);
        } else if (diff < 0) {
          // Nhan should pay this person (they overpaid)
          nhanShouldTransfer.push(`${name}: ${formatMoney(Math.abs(diff))}`);
        }
      }

      const monthName = new Date(year, month - 1).toLocaleString("en-US", {
        month: "long",
      });

      const lines: string[] = [];
      lines.push(
        `📊 **Summary — ${monthName} ${year}**\n` +
          `Total money spent: ${formatMoney(totalMoneySpent)}`
      );

      if (namesWithRecords > 0) {
        lines.push(
          `Each person should pay: ${formatMoney(perPersonShare)}`
        );
      }

      if (spendingLines) {
        lines.push(`Current spending:\n${spendingLines}`);
      }

      if (transfersToNhan.length > 0) {
        lines.push(`→ Transfer to Nhan:\n${transfersToNhan.join("\n")}`);
      }

      if (nhanShouldTransfer.length > 0) {
        lines.push(`→ Nhan should transfer:\n${nhanShouldTransfer.join("\n")}`);
      }

      if (transfersToNhan.length === 0 && nhanShouldTransfer.length === 0) {
        lines.push("(All settled!)");
      }

      await ctx.reply(lines.join("\n\n"), { parse_mode: "Markdown" });
    } catch (err) {
      console.error("[/summarize] Error:", err);
      const message =
        err instanceof GrammyError
          ? `Telegram error: ${err.message}`
          : "Failed to generate summary.";
      await ctx.reply(`❌ ${message}`);
    }
  });
}

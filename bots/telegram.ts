/**
 * AlpClaw Telegram connector node.
 *
 * Configure:
 *   TELEGRAM_BOT_TOKEN    from @BotFather
 *
 * Features:
 *   - Auto-fetches bot identity via getMe() and prints "Connected as @username"
 *   - Live-logs incoming and outgoing messages in the terminal
 *   - Uses character.md persona if present
 */

import { Telegraf } from "telegraf";
import pc from "picocolors";
import { runChatTask, getAlpClaw, chunkText } from "./lib/chat-agent.js";

const MAX_MSG = 3800;

function ts() {
  return pc.dim(new Date().toLocaleTimeString());
}

async function main() {
  console.log("");
  console.log(pc.bgCyan(pc.black(" ALPCLAW ")) + pc.cyan(" Telegram Bridge"));
  console.log("");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error(pc.bgRed(pc.white(" ERROR ")) + " TELEGRAM_BOT_TOKEN is not set.");
    console.error(pc.dim("Run: alpclaw config set-bot telegram TELEGRAM_BOT_TOKEN <token>"));
    process.exit(1);
  }

  // Initialize the agent framework
  getAlpClaw();
  const bot = new Telegraf(token);

  // Auto-identify — fetch bot info from Telegram API
  try {
    const me = await bot.telegram.getMe();
    console.log(pc.green("✓") + ` Connected as ${pc.bold("@" + me.username)} (${me.first_name})`);
    console.log(pc.dim(`  Bot ID: ${me.id} | Can join groups: ${me.can_join_groups}`));
  } catch (e: any) {
    console.error(pc.red("✗ Failed to connect:"), e.message);
    process.exit(1);
  }

  console.log(pc.dim("─".repeat(60)));
  console.log(pc.dim("Waiting for messages... (Ctrl+C to stop)\n"));

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const from = ctx.message.from;
    const chatId = ctx.chat.id;
    const msgId = ctx.message.message_id;
    const userName = from.username ? `@${from.username}` : from.first_name;

    // Live-log incoming message
    console.log(`${ts()} ${pc.cyan("◀ IN")}  ${pc.bold(userName)} ${pc.dim(`(chat ${chatId})`)}`);
    console.log(`       ${text.length > 120 ? text.slice(0, 120) + "…" : text}`);

    const waitingMsg = await ctx.reply("⏳ Thinking...", {
      reply_parameters: { message_id: msgId },
    });

    const startMs = Date.now();
    const { reply, success } = await runChatTask(text);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

    const pieces = chunkText(reply, MAX_MSG);

    try {
      await ctx.telegram.editMessageText(chatId, waitingMsg.message_id, undefined, pieces[0]!);
      for (let i = 1; i < pieces.length; i++) {
        await ctx.reply(pieces[i]!, { reply_parameters: { message_id: msgId } });
      }

      // Live-log outgoing reply
      const statusIcon = success ? pc.green("✓") : pc.red("✗");
      console.log(`${ts()} ${pc.magenta("▶ OUT")} ${statusIcon} ${pc.dim(`(${elapsed}s, ${pieces.length} msg${pieces.length > 1 ? "s" : ""})`)}`);
      console.log(`       ${reply.length > 120 ? reply.slice(0, 120) + "…" : reply}`);
      console.log("");
    } catch (e: any) {
      console.log(`${ts()} ${pc.red("▶ ERR")} Failed to deliver: ${e.message}`);
      await ctx.telegram.editMessageText(
        chatId,
        waitingMsg.message_id,
        undefined,
        "⚠️ Failed to deliver reply: " + String(e?.message || e),
      );
    }
  });

  bot.launch();
  console.log(pc.green("⚡ Bot is live and listening!"));

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

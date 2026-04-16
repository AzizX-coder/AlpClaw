/**
 * AlpClaw Telegram connector node.
 *
 * Configure:
 *   TELEGRAM_BOT_TOKEN    from @BotFather
 */

import { Telegraf } from "telegraf";
import pc from "picocolors";
import { runChatTask, getAlpClaw, chunkText } from "./lib/chat-agent.js";

const MAX_MSG = 3800;

async function main() {
  console.log(pc.bgCyan(pc.black(" SYSTEM BOOT ")) + " AlpClaw Telegram Connector");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error(pc.bgRed(pc.white(" ERROR ")) + " TELEGRAM_BOT_TOKEN environment variable is not defined.");
    process.exit(1);
  }

  getAlpClaw();
  const bot = new Telegraf(token);

  console.log(pc.green("✓ Framework Initialized."));
  console.log(pc.dim("Connecting to Telegram..."));

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const msgId = ctx.message.message_id;
    console.log(pc.dim(`[telegram] ${text.slice(0, 80)}`));

    const waitingMsg = await ctx.reply("⏳ Let me think...", {
      reply_parameters: { message_id: msgId },
    });

    const { reply } = await runChatTask(text);
    const pieces = chunkText(reply, MAX_MSG);

    try {
      await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, undefined, pieces[0]!);
      for (let i = 1; i < pieces.length; i++) {
        await ctx.reply(pieces[i]!, { reply_parameters: { message_id: msgId } });
      }
    } catch (e: any) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        waitingMsg.message_id,
        undefined,
        "⚠️ Failed to deliver reply: " + String(e?.message || e),
      );
    }
  });

  bot.launch();
  console.log(pc.green(`⚡ AlpClaw Telegram Bot is online and listening!`));

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

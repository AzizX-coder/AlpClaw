import { AlpClaw } from "@alpclaw/core";
import { Telegraf } from "telegraf";
import pc from "picocolors";

async function main() {
  console.log(pc.bgCyan(pc.black(" SYSTEM BOOT ")) + " AlpClaw Telegram Connector");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error(pc.bgRed(pc.white(" ERROR ")) + " TELEGRAM_BOT_TOKEN environment variable is not defined.");
    process.exit(1);
  }

  const agentConfig = AlpClaw.create();
  const bot = new Telegraf(token);

  console.log(pc.green("✓ Framework Initialized."));
  console.log(pc.dim("Connecting to Telegram..."));

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const msgId = ctx.message.message_id;

    console.log(pc.dim(`Received message: ${text}`));

    // Reply thinking state
    const waitingMsg = await ctx.reply("⏳ Let me think...", { reply_parameters: { message_id: msgId } });

    try {
      const threadAgent = agentConfig.createAgent();
      const response = await threadAgent.run(text);

      if (response.ok) {
        const result = response.value.result?.summary;
        // Edit the waiting message with final response
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          waitingMsg.message_id, 
          undefined, 
          result || "Task completed, but I have no verbal summary."
        );
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          waitingMsg.message_id, 
          undefined, 
          "❌ " + response.error.message
        );
      }
    } catch (e: any) {
      await ctx.telegram.editMessageText(
        ctx.chat.id, 
        waitingMsg.message_id, 
        undefined, 
        "⚠️ Fatal error: " + String(e.message)
      );
    }
  });

  bot.launch();
  console.log(pc.green(`⚡ AlpClaw Telegram Bot is online and listening!`));

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

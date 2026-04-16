import type { ConnectorAction, Result, ToolDefinition } from "@alpclaw/utils";
import { ok, err, createError, createLogger } from "@alpclaw/utils";
import type { Connector } from "./connector.js";

const log = createLogger("connector:messaging");

/**
 * Messaging connector — unified interface for Slack, Discord, Telegram, email.
 * Each platform is configured as a "channel" with its own webhook/token.
 */

export interface MessagingChannel {
  platform: "slack" | "discord" | "telegram" | "email";
  name: string;
  /** Webhook URL (Slack/Discord) or bot token (Telegram) */
  credential: string;
  /** Chat ID for Telegram, channel for Slack, etc. */
  target?: string;
}

export class MessagingConnector implements Connector {
  readonly name = "messaging";
  readonly category = "messaging" as const;
  readonly description = "Send messages to Slack, Discord, Telegram, or email";

  private channels = new Map<string, MessagingChannel>();

  constructor(channels?: MessagingChannel[]) {
    if (channels) {
      for (const ch of channels) {
        this.channels.set(ch.name, ch);
      }
    }
  }

  registerChannel(channel: MessagingChannel): void {
    this.channels.set(channel.name, channel);
    log.info("Messaging channel registered", { name: channel.name, platform: channel.platform });
  }

  listActions(): ConnectorAction[] {
    return [
      {
        name: "send",
        description: "Send a message to a registered channel",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Channel alias name" },
            message: { type: "string", description: "Message text" },
          },
          required: ["channel", "message"],
        },
        riskLevel: "moderate",
      },
    ];
  }

  toToolDefinitions(): ToolDefinition[] {
    const channels = Array.from(this.channels.keys()).join(", ") || "none";
    return [
      {
        name: `${this.name}.send`,
        description: `Send a message. Available channels: ${channels}`,
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string" },
            message: { type: "string" },
          },
          required: ["channel", "message"],
        },
      },
    ];
  }

  async execute(action: string, args: Record<string, unknown>): Promise<Result<unknown>> {
    if (action !== "send") {
      return err(createError("connector", `Unknown messaging action: ${action}`));
    }

    const channelName = args["channel"] as string;
    const message = args["message"] as string;
    const channel = this.channels.get(channelName);

    if (!channel) {
      return err(createError("connector", `Unknown messaging channel: ${channelName}`));
    }

    switch (channel.platform) {
      case "slack":
        return this.sendSlack(channel, message);
      case "discord":
        return this.sendDiscord(channel, message);
      case "telegram":
        return this.sendTelegram(channel, message);
      case "email":
        return ok({ sent: false, reason: "Email requires SMTP configuration — not yet implemented" });
      default:
        return err(createError("connector", `Unsupported platform: ${channel.platform}`));
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.channels.size > 0;
  }

  private async sendSlack(channel: MessagingChannel, message: string): Promise<Result<unknown>> {
    try {
      const res = await fetch(channel.credential, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      log.info("Slack message sent", { channel: channel.name });
      return ok({ sent: true, status: res.status });
    } catch (cause) {
      return err(createError("connector", "Slack send failed", { cause, retryable: true }));
    }
  }

  private async sendDiscord(channel: MessagingChannel, message: string): Promise<Result<unknown>> {
    try {
      const res = await fetch(channel.credential, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      log.info("Discord message sent", { channel: channel.name });
      return ok({ sent: true, status: res.status });
    } catch (cause) {
      return err(createError("connector", "Discord send failed", { cause, retryable: true }));
    }
  }

  private async sendTelegram(channel: MessagingChannel, message: string): Promise<Result<unknown>> {
    try {
      const url = `https://api.telegram.org/bot${channel.credential}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel.target,
          text: message,
          parse_mode: "Markdown",
        }),
      });
      log.info("Telegram message sent", { channel: channel.name });
      return ok({ sent: true, status: res.status });
    } catch (cause) {
      return err(createError("connector", "Telegram send failed", { cause, retryable: true }));
    }
  }
}

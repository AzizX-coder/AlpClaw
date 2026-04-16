import type { ConnectorAction, Result, ToolDefinition } from "@alpclaw/utils";
import { ok, err, createError, createLogger } from "@alpclaw/utils";
import type { Connector } from "./connector.js";

const log = createLogger("connector:webhook");

/**
 * Webhook connector — send HTTP requests to arbitrary endpoints.
 * Useful for integrations with Slack, Discord, Telegram, custom APIs, etc.
 */
export class WebhookConnector implements Connector {
  readonly name = "webhook";
  readonly category = "webhook" as const;
  readonly description = "Send HTTP requests to webhook endpoints and APIs";

  /** Pre-registered webhook URLs by alias, so the LLM never sees raw URLs. */
  private endpoints = new Map<string, { url: string; headers?: Record<string, string> }>();

  constructor(
    endpoints?: Record<string, { url: string; headers?: Record<string, string> }>,
  ) {
    if (endpoints) {
      for (const [alias, config] of Object.entries(endpoints)) {
        this.endpoints.set(alias, config);
      }
    }
  }

  /** Register a named endpoint. */
  registerEndpoint(
    alias: string,
    url: string,
    headers?: Record<string, string>,
  ): void {
    this.endpoints.set(alias, { url, headers });
    log.info("Webhook endpoint registered", { alias });
  }

  listActions(): ConnectorAction[] {
    return [
      {
        name: "send",
        description: "Send a POST request to a registered webhook endpoint",
        parameters: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "Registered endpoint alias",
            },
            payload: {
              type: "object",
              description: "JSON payload to send",
            },
          },
          required: ["endpoint", "payload"],
        },
        riskLevel: "moderate",
      },
      {
        name: "fetch",
        description: "Send a GET request to a registered endpoint",
        parameters: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "Registered endpoint alias",
            },
            queryParams: {
              type: "object",
              description: "Query parameters",
            },
          },
          required: ["endpoint"],
        },
        riskLevel: "safe",
      },
    ];
  }

  toToolDefinitions(): ToolDefinition[] {
    return this.listActions().map((action) => ({
      name: `${this.name}.${action.name}`,
      description: `${action.description}. Available endpoints: ${Array.from(this.endpoints.keys()).join(", ") || "none registered"}`,
      parameters: action.parameters,
    }));
  }

  async execute(action: string, args: Record<string, unknown>): Promise<Result<unknown>> {
    const alias = args["endpoint"] as string;
    const endpoint = this.endpoints.get(alias);
    if (!endpoint) {
      return err(
        createError("connector", `Unknown webhook endpoint: ${alias}. Register it first.`),
      );
    }

    switch (action) {
      case "send":
        return this.sendPost(endpoint, args["payload"] as Record<string, unknown>);
      case "fetch":
        return this.sendGet(endpoint, args["queryParams"] as Record<string, string> | undefined);
      default:
        return err(createError("connector", `Unknown webhook action: ${action}`));
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.endpoints.size > 0;
  }

  private async sendPost(
    endpoint: { url: string; headers?: Record<string, string> },
    payload: Record<string, unknown>,
  ): Promise<Result<unknown>> {
    try {
      log.info("Sending webhook POST", { url: endpoint.url.slice(0, 50) });
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...endpoint.headers,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return ok({ status: res.status, body });
    } catch (cause) {
      return err(createError("connector", "Webhook POST failed", { cause, retryable: true }));
    }
  }

  private async sendGet(
    endpoint: { url: string; headers?: Record<string, string> },
    queryParams?: Record<string, string>,
  ): Promise<Result<unknown>> {
    try {
      let url = endpoint.url;
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        url += `?${params.toString()}`;
      }
      const res = await fetch(url, {
        headers: endpoint.headers,
      });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return ok({ status: res.status, body });
    } catch (cause) {
      return err(createError("connector", "Webhook GET failed", { cause, retryable: true }));
    }
  }
}

import { describe, it, expect } from "vitest";
import { BrowserConnector } from "./browser.js";

describe("BrowserConnector", () => {
  const browser = new BrowserConnector();

  it("rejects non-http URLs", async () => {
    const res = await browser.execute("fetch_text", { url: "file:///tmp/x" });
    expect(res.ok).toBe(false);
  });

  it("lists fetch_text and fetch_links actions", () => {
    const actions = browser.listActions().map((a) => a.name);
    expect(actions).toContain("fetch_text");
    expect(actions).toContain("fetch_links");
  });

  it("strips scripts and styles from HTML", async () => {
    // Exercise the private html-to-text path via a dummy subclass
    class X extends BrowserConnector {
      public strip(html: string): string {
        return (this as any).htmlToText(html);
      }
    }
    const out = new X().strip('<style>x{}</style><script>y</script><p>hello <b>world</b></p>');
    expect(out).not.toContain("y");
    expect(out).not.toContain("{}");
    expect(out).toContain("hello");
    expect(out).toContain("world");
  });
});

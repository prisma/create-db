import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { reportFreebuffClaim } from "@/lib/freebuff";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

function cloudflareContext(reportClaim: (accountId: string) => Promise<string>) {
  const idFromName = vi.fn((name: string) => `id:${name}`);
  const get = vi.fn(() => ({ reportClaim }));
  const waitUntil = vi.fn();
  vi.mocked(getCloudflareContext).mockReturnValue({
    env: { FREEBUFF_CLICK: { idFromName, get } },
    ctx: { waitUntil },
  } as unknown as ReturnType<typeof getCloudflareContext>);
  return { idFromName, get, waitUntil };
}

describe("reportFreebuffClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports the claim for the project, after the response", async () => {
    const reportClaim = vi.fn().mockResolvedValue("reported");
    const { idFromName, get, waitUntil } = cloudflareContext(reportClaim);

    reportFreebuffClaim("proj_1", "workspace_1");

    expect(idFromName).toHaveBeenCalledWith("proj_1");
    expect(get).toHaveBeenCalledWith("id:proj_1");
    expect(reportClaim).toHaveBeenCalledWith("workspace_1");
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBe("reported");
  });

  it("does not throw when the report fails", async () => {
    const { waitUntil } = cloudflareContext(
      vi.fn().mockRejectedValue(new Error("create-db worker is down"))
    );

    expect(() => reportFreebuffClaim("proj_1", "workspace_1")).not.toThrow();
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
  });

  it("does not throw when the binding or the Cloudflare context is missing", () => {
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: {},
      ctx: { waitUntil: vi.fn() },
    } as unknown as ReturnType<typeof getCloudflareContext>);
    expect(() => reportFreebuffClaim("proj_1", "workspace_1")).not.toThrow();

    vi.mocked(getCloudflareContext).mockImplementation(() => {
      throw new Error("no Cloudflare context");
    });
    expect(() => reportFreebuffClaim("proj_1", "workspace_1")).not.toThrow();
  });

  it("reports nothing without an account id", () => {
    const reportClaim = vi.fn();
    cloudflareContext(reportClaim);

    reportFreebuffClaim("proj_1", "");

    expect(reportClaim).not.toHaveBeenCalled();
  });
});

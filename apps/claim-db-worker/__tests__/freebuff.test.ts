import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { reportFreebuffClaim } from "@/lib/freebuff";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

function cloudflareContext(
  reportFreebuffClaim: (projectID: string) => Promise<string>
) {
  const waitUntil = vi.fn();
  vi.mocked(getCloudflareContext).mockReturnValue({
    env: { CREATE_DB_WORKER: { reportFreebuffClaim } },
    ctx: { waitUntil },
  } as unknown as ReturnType<typeof getCloudflareContext>);
  return { waitUntil };
}

describe("reportFreebuffClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports the claim for the project, after the response", async () => {
    const reportClaim = vi.fn().mockResolvedValue("reported");
    const { waitUntil } = cloudflareContext(reportClaim);

    reportFreebuffClaim("proj_1");

    expect(reportClaim).toHaveBeenCalledWith("proj_1");
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBe("reported");
  });

  it("does not throw when the report fails", async () => {
    const { waitUntil } = cloudflareContext(
      vi.fn().mockRejectedValue(new Error("create-db worker is down"))
    );

    expect(() => reportFreebuffClaim("proj_1")).not.toThrow();
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
  });

  it("does not throw when the binding or the Cloudflare context is missing", () => {
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: {},
      ctx: { waitUntil: vi.fn() },
    } as unknown as ReturnType<typeof getCloudflareContext>);
    expect(() => reportFreebuffClaim("proj_1")).not.toThrow();

    vi.mocked(getCloudflareContext).mockImplementation(() => {
      throw new Error("no Cloudflare context");
    });
    expect(() => reportFreebuffClaim("proj_1")).not.toThrow();
  });
});

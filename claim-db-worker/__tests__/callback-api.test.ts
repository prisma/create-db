// __tests__/callback-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../app/api/auth/callback/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    CLAIM_DB_RATE_LIMITER: {
      limit: vi.fn(() => Promise.resolve({ success: true })),
    },
    POSTHOG_API_KEY: "test-key",
    POSTHOG_API_HOST: "https://app.posthog.com",
  })),
}));

vi.mock("@/lib/auth-utils", () => ({
  exchangeCodeForToken: vi.fn(),
  validateProject: vi.fn(),
}));

vi.mock("@/lib/response-utils", () => ({
  redirectToError: vi.fn(),
  redirectToSuccess: vi.fn(),
  getBaseUrl: vi.fn(() => "http://localhost:3000"),
}));

vi.mock("@/lib/project-transfer", () => ({
  transferProject: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("auth callback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful claim flow", () => {
    it("completes full OAuth callback and project transfer", async () => {
      const { exchangeCodeForToken, validateProject } = await import(
        "@/lib/auth-utils"
      );
      const { redirectToError, redirectToSuccess } = await import(
        "@/lib/response-utils"
      );
      const { transferProject } = await import("@/lib/project-transfer");

      vi.mocked(exchangeCodeForToken).mockResolvedValue({
        access_token: "test-token",
      });

      vi.mocked(validateProject).mockResolvedValue(undefined);

      vi.mocked(transferProject).mockResolvedValue({
        success: true,
        status: 200,
        transferResponse: {},
      });

      vi.mocked(redirectToSuccess).mockReturnValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/success?projectID=test-project-123" },
        })
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { workspace: { id: "wksp_test-workspace-123" } },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: "db_test-database-123" }],
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?code=test-code&state=test-state&projectID=test-project-123"
      );

      const response = await GET(request);

      expect(exchangeCodeForToken).toHaveBeenCalledWith(
        "test-code",
        expect.stringContaining("test-project-123")
      );
      expect(validateProject).toHaveBeenCalledWith("test-project-123");
      expect(transferProject).toHaveBeenCalledWith(
        "test-project-123",
        "test-token"
      );
      expect(redirectToSuccess).toHaveBeenCalledWith(
        request,
        "test-project-123",
        "test-workspace-123", // workspaceId
        "test-database-123" // databaseId
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("posthog.com"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("create_db:claim_successful"),
        })
      );
    });
  });

  describe("error handling", () => {
    it("handles missing parameters", async () => {
      const { redirectToError } = await import("@/lib/response-utils");

      vi.mocked(redirectToError).mockReturnValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/error" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?code=test-code"
      );

      await GET(request);

      expect(redirectToError).toHaveBeenCalledWith(
        request,
        "Missing State Parameter",
        "Please try again.",
        "The state parameter is required for security purposes."
      );
    });

    it("handles auth token exchange failure", async () => {
      const { exchangeCodeForToken } = await import("@/lib/auth-utils");
      const { redirectToError } = await import("@/lib/response-utils");

      vi.mocked(exchangeCodeForToken).mockRejectedValue(
        new Error("Invalid authorization code")
      );

      vi.mocked(redirectToError).mockReturnValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/error" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?code=invalid-code&state=test-state&projectID=test-project-123"
      );

      await GET(request);

      expect(redirectToError).toHaveBeenCalledWith(
        request,
        "Authentication Failed",
        "Failed to authenticate with Prisma. Please try again.",
        "Invalid authorization code"
      );
    });

    it("handles project transfer failure", async () => {
      const { exchangeCodeForToken, validateProject } = await import(
        "@/lib/auth-utils"
      );
      const { redirectToError } = await import("@/lib/response-utils");
      const { transferProject } = await import("@/lib/project-transfer");

      vi.mocked(exchangeCodeForToken).mockResolvedValue({
        access_token: "test-token",
      });

      vi.mocked(validateProject).mockResolvedValue(undefined);

      vi.mocked(transferProject).mockResolvedValue({
        success: false,
        status: 403,
        error: "Insufficient permissions",
        transferResponse: {},
      });

      vi.mocked(redirectToError).mockReturnValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/error" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?code=test-code&state=test-state&projectID=test-project-123"
      );

      await GET(request);

      expect(redirectToError).toHaveBeenCalledWith(
        request,
        "Transfer Failed",
        "Failed to transfer the project. Please try again.",
        expect.stringContaining("Insufficient permissions")
      );
    });
  });
});

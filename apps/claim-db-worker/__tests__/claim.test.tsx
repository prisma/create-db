import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ClaimPage from "../app/claim/page";

// This test does not check the actual claim flow, but rather the claim page functionality and claim flow logic.
// It mocks the fetch API and window.location to simulate the claim flow,
// so long as the Management API is functioning properly, this should be as well.

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAssign = vi.fn();
Object.defineProperty(window, "location", {
  writable: true,
  value: { ...window.location, origin: "http://localhost:3000", assign: mockAssign },
});

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe("claim page", () => {
  const mockSearchParams = new URLSearchParams();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSearchParams).mockReturnValue(
      mockSearchParams as unknown as ReturnType<typeof useSearchParams>
    );
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue("/claim");

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        authUrl: "https://auth.example.com/callback?code=test",
      }),
    });
  });

  describe("rendering", () => {
    it("renders claim page with projectID", () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<ClaimPage />);
      expect(screen.getByText("Claim your database")).toBeInTheDocument();
    });
  });

  describe("functionality", () => {
    it("sends the browser to sign in and keeps the button disabled", async () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<ClaimPage />);

      const claimButton = screen.getByRole("button", { name: "Claim database" });
      expect(claimButton).not.toBeDisabled();

      fireEvent.click(claimButton);

      expect(claimButton).toBeDisabled();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/url",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: expect.stringContaining("test-project-123"),
          })
        );
      });

      await waitFor(() => {
        expect(mockAssign).toHaveBeenCalledWith(
          "https://auth.example.com/callback?code=test"
        );
      });

      expect(claimButton).toBeDisabled();
    });

    it("starts one claim however often the button is clicked", async () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<ClaimPage />);

      const claimButton = screen.getByRole("button", { name: "Claim database" });
      fireEvent.click(claimButton);
      await waitFor(() => expect(mockAssign).toHaveBeenCalledTimes(1));
      fireEvent.click(claimButton);
      fireEvent.click(claimButton);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockAssign).toHaveBeenCalledTimes(1);
    });

    it("handles auth endpoint errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      mockSearchParams.set("projectID", "test-project-123");
      render(<ClaimPage />);

      const claimButton = screen.getByRole("button", { name: "Claim database" });
      fireEvent.click(claimButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error:", expect.any(Error));
      });

      expect(mockAssign).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(claimButton).not.toBeDisabled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe("integration", () => {
    it("simulates complete successful claim flow", async () => {
      mockSearchParams.set("projectID", "test-project-123");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            authUrl:
              "https://auth.prisma.io/oauth?code=test&state=test&projectID=test-project-123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<ClaimPage />);

      const claimButton = screen.getByRole("button", { name: "Claim database" });

      fireEvent.click(claimButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/url",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("test-project-123"),
          })
        );
      });

      await waitFor(() => {
        expect(mockAssign).toHaveBeenCalledWith(
          expect.stringContaining("test-project-123")
        );
      });

      expect(claimButton).toBeDisabled();
    });
  });
});

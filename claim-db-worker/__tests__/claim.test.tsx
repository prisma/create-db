// __tests__/claim.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearchParams, useRouter } from "next/navigation";
import ClaimPage from "../app/claim/page";

// Mock the fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.open to suppress stderr warning
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

describe("claim page", () => {
  const mockSearchParams = new URLSearchParams();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock implementation for each test
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    // Mock successful fetch response for auth URL
    mockFetch.mockResolvedValueOnce({
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
    it("calls auth endpoint when claim button is clicked", async () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<ClaimPage />);
      fireEvent.click(screen.getByText("Claim database"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/url",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      });
    });
  });
});

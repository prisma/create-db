// __tests__/success.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import SuccessPage from "../app/success/page";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

describe("success page", () => {
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  describe("rendering", () => {
    it("renders success page with congratulations message", () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<SuccessPage />);

      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      expect(
        screen.getByText("You have successfully claimed your database")
      ).toBeInTheDocument();
    });

    it("renders console link to use database", () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<SuccessPage />);

      const consoleLink = screen.getByText("Go use your database");
      expect(consoleLink).toBeInTheDocument();
      expect(consoleLink.closest("a")).toHaveAttribute(
        "href",
        "https://console.prisma.io/"
      );
      expect(consoleLink.closest("a")).toHaveAttribute("target", "_blank");
    });

    it("displays success visual elements", () => {
      mockSearchParams.set("projectID", "test-project-123");
      render(<SuccessPage />);

      expect(screen.getByAltText("Database Success")).toBeInTheDocument();
    });
  });
});

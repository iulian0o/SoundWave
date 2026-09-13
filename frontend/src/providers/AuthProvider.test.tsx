// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";

import AuthProvider from "./AuthProvider";

import { useAuth } from "@clerk/react";
import { useAuthStore } from "../stores/useAuthStore";

vi.mock("@clerk/react", () => ({ useAuth: vi.fn() }));
vi.mock("../stores/useAuthStore", () => ({ useAuthStore: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("shows a loading state while Clerk has not finished loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn(),
      isSignedIn: false,
      isLoaded: false,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({
      checkAdminStatus: vi.fn(),
      reset: vi.fn(),
    } as any);

    render(
      <AuthProvider>
        <div>protected content</div>
      </AuthProvider>,
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders children after a signed-in user's admin check resolves", async () => {
    const checkAdminStatus = vi.fn().mockResolvedValue(undefined);
    const reset = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn(),
      isSignedIn: true,
      isLoaded: true,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({ checkAdminStatus, reset } as any);

    render(
      <AuthProvider>
        <div>protected content</div>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("protected content")).toBeInTheDocument(),
    );
    expect(checkAdminStatus).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it("resets auth state and renders children when the user is signed out", async () => {
    const checkAdminStatus = vi.fn();
    const reset = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn(),
      isSignedIn: false,
      isLoaded: true,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({ checkAdminStatus, reset } as any);

    render(
      <AuthProvider>
        <div>protected content</div>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("protected content")).toBeInTheDocument(),
    );
    expect(reset).toHaveBeenCalledTimes(1);
    expect(checkAdminStatus).not.toHaveBeenCalled();
  });

  it("does not get stuck loading forever if the admin check fails", async () => {
    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn(),
      isSignedIn: true,
      isLoaded: true,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({
      checkAdminStatus: vi.fn().mockRejectedValue(new Error("network down")),
      reset: vi.fn(),
    } as any);

    render(
      <AuthProvider>
        <div>protected content</div>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("protected content")).toBeInTheDocument(),
    );
  });
});

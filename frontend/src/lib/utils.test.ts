import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges plain class name strings", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("resolves conflicting Tailwind classes, keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("applies conditional classes based on truthy/falsy values", () => {
    const isHidden = false;
    const isActive = true;
    expect(cn("base", isHidden && "hidden", isActive && "block")).toBe("base block");
  });

  it("ignores null, undefined, and empty strings", () => {
    expect(cn("base", null, undefined, "")).toBe("base");
  });
});
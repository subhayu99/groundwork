import { describe, it, expect } from "vitest";
import {
  listCategories,
  getCategory,
  listTopicsInCategory,
  getTopic,
  listAllTopics,
} from "@/categories/registry";

describe("category registry", () => {
  it("lists categories in order", () => {
    const cats = listCategories();
    expect(cats.map((c) => c.key)).toEqual(["data-structures", "algorithms"]);
  });

  it("returns undefined for unknown category", () => {
    expect(getCategory("nope")).toBeUndefined();
  });

  it("returns sliding-window in algorithms", () => {
    const topics = listTopicsInCategory("algorithms");
    expect(topics.find((t) => t.key === "sliding-window")).toBeDefined();
  });

  it("getTopic resolves a topic by category and key", () => {
    const topic = getTopic("algorithms", "sliding-window");
    expect(topic?.name).toBe("Sliding Window");
    expect(topic?.principles).toContain("information-reuse");
  });

  it("listAllTopics returns at least sliding-window", () => {
    const all = listAllTopics();
    expect(all.length).toBeGreaterThanOrEqual(1);
  });
});

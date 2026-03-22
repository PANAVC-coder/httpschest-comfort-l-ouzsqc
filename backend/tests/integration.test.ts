import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let entryId: string;

  test("Sign up test user", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    userId = user.id;
    expect(authToken).toBeDefined();
  });

  test("Create entry", async () => {
    const res = await authenticatedApi("/api/entries", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comfort_level: 7,
        triggers: ["work", "stress"],
        occurred_at: new Date().toISOString(),
        notes: "Test entry"
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    entryId = data.id;
    expect(entryId).toBeDefined();
  });

  test("Create entry - missing required field", async () => {
    const res = await authenticatedApi("/api/entries", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comfort_level: 7,
        triggers: ["work"],
        // missing occurred_at
      }),
    });
    await expectStatus(res, 400);
  });

  test("List entries", async () => {
    const res = await authenticatedApi("/api/entries", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.entries)).toBe(true);
  });

  test("List entries with pagination", async () => {
    const res = await authenticatedApi("/api/entries?limit=10&offset=0", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.entries)).toBe(true);
  });

  test("Get entry by ID", async () => {
    const res = await authenticatedApi(`/api/entries/${entryId}`, authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(entryId);
  });

  test("Get entry - not found", async () => {
    const res = await authenticatedApi("/api/entries/00000000-0000-0000-0000-000000000000", authToken);
    await expectStatus(res, 404);
  });

  test("Update entry", async () => {
    const res = await authenticatedApi(`/api/entries/${entryId}`, authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comfort_level: 8,
        notes: "Updated entry"
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(entryId);
  });

  test("Delete entry", async () => {
    const res = await authenticatedApi(`/api/entries/${entryId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Get deleted entry - should return 404", async () => {
    const res = await authenticatedApi(`/api/entries/${entryId}`, authToken);
    await expectStatus(res, 404);
  });

  test("Delete nonexistent entry", async () => {
    const res = await authenticatedApi("/api/entries/00000000-0000-0000-0000-000000000000", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  test("Get insights", async () => {
    const res = await authenticatedApi("/api/insights", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.average_comfort).toBeDefined();
    expect(data.total_entries).toBeDefined();
    expect(data.trend).toBeDefined();
  });

  test("Get insights with days parameter", async () => {
    const res = await authenticatedApi("/api/insights?days=7", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.top_triggers).toBeDefined();
    expect(data.daily_averages).toBeDefined();
  });

  test("Unauthenticated request to entries - should fail", async () => {
    const res = await api("/api/entries");
    await expectStatus(res, 401);
  });

  test("Unauthenticated request to insights - should fail", async () => {
    const res = await api("/api/insights");
    await expectStatus(res, 401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Stub the HubSpot proxy so no real contacts are created. The route calls
// createHubSpotContact; we replace it with a spy we can assert on.
vi.mock("../lib/hubspot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/hubspot")>();
  return {
    ...actual,
    createHubSpotContact: vi.fn(async () => {}),
  };
});

import app from "../app";
import { createHubSpotContact } from "../lib/hubspot";

const mockedCreate = vi.mocked(createHubSpotContact);

const validPayload = {
  name: "Jane Founder",
  company: "Vertus",
  email: "jane@example.com",
  message: "We would like to discuss a partnership.",
  lang: "en",
};

// Each test uses a distinct X-Forwarded-For IP so the module-level rate
// limiter buckets stay isolated across tests.
function post(body: Record<string, unknown>, ip: string) {
  return request(app)
    .post("/api/contact")
    .set("X-Forwarded-For", ip)
    .send(body);
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    mockedCreate.mockClear();
  });

  it("accepts a valid submission and forwards it to HubSpot", async () => {
    const res = await post(validPayload, "10.0.0.1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        company: validPayload.company,
        email: validPayload.email,
        message: validPayload.message,
        lang: "en",
        formSource: "Vertus Mexico Contact Us",
      }),
    );
  });

  it("extracts and sanitizes attribution fields (UTM params + pagePath)", async () => {
    const res = await post(
      {
        ...validPayload,
        pagePath: "/investors",
        utm_source: "linkedin",
        utm_medium: "social",
        utm_campaign: "brand_awareness",
        utm_term: "wealth management",
        utm_content: "header_image",
      },
      "10.0.0.10",
    );

    expect(res.status).toBe(200);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        attribution: {
          pagePath: "/investors",
          utmSource: "linkedin",
          utmMedium: "social",
          utmCampaign: "brand_awareness",
          utmTerm: "wealth management",
          utmContent: "header_image",
        },
      }),
    );
  });

  it("rejects a submission missing required fields with 400 and no HubSpot call", async () => {
    const res = await post({ company: "Vertus" }, "10.0.0.2");

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid email with 400 and no HubSpot call", async () => {
    const res = await post({ ...validPayload, email: "not-an-email" }, "10.0.0.3");

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("silently accepts a honeypot submission with 200 and no HubSpot call", async () => {
    const res = await post(
      { ...validPayload, website: "http://spam.example" },
      "10.0.0.4",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("returns 429 once the per-IP rate limit is exceeded", async () => {
    const ip = "10.0.0.5";

    // The limiter allows 5 submissions per window; the 6th must be blocked.
    for (let i = 0; i < 5; i++) {
      const ok = await post(validPayload, ip);
      expect(ok.status).toBe(200);
    }

    const blocked = await post(validPayload, ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
  });
});

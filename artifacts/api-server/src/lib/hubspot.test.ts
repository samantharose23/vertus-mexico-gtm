import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the payloads sent through the connector proxy so we can assert the
// exact HubSpot properties (including form_source) that get forwarded.
const proxyMock = vi.fn();

vi.mock("@replit/connectors-sdk", () => ({
  ReplitConnectors: class {
    proxy = proxyMock;
  },
}));

import {
  createHubSpotContact,
  FORM_SOURCE_PROPERTY,
  FORM_SOURCES,
  FORM_SOURCE_VALUES,
  isKnownFormSource,
  assertKnownFormSource,
  fetchFormSourceOptions,
  verifyFormSourceOptions,
  LANDING_PAGE_PROPERTY,
  UTM_PROPERTIES,
  type ContactSubmission,
} from "./hubspot";

const submission: ContactSubmission = {
  name: "María de la Cruz",
  company: "Vertus",
  email: "maria@example.com",
  message: "Hola, quisiera más información.",
  lang: "es",
  formSource: "Vertus Mexico Contact Us",
};

function okResponse() {
  return { ok: true, status: 200 };
}

function parseBody(call: unknown[]): { properties: Record<string, string> } {
  const opts = call[2] as { body: string };
  return JSON.parse(opts.body);
}

describe("createHubSpotContact", () => {
  beforeEach(() => {
    proxyMock.mockReset();
  });

  it("stamps form_source in the create payload with the exact value", async () => {
    proxyMock.mockResolvedValueOnce(okResponse());

    await createHubSpotContact(submission);

    expect(proxyMock).toHaveBeenCalledTimes(1);
    const body = parseBody(proxyMock.mock.calls[0]);
    expect(body.properties[FORM_SOURCE_PROPERTY]).toBe("Vertus Mexico Contact Us");
    expect(body.properties.email).toBe("maria@example.com");
    expect(body.properties.firstname).toBe("María");
    expect(body.properties.lastname).toBe("de la Cruz");
    expect(body.properties.hs_language).toBe("es");
  });

  it("throws loudly and makes no HubSpot call when form_source is unknown", async () => {
    await expect(
      createHubSpotContact({ ...submission, formSource: "typo value" }),
    ).rejects.toThrow(/Unknown form_source value "typo value"/);

    expect(proxyMock).not.toHaveBeenCalled();
  });

  it("stamps form_source on the update path when the contact already exists", async () => {
    // 1) create -> 409, 2) search -> found id, 3) update -> ok
    proxyMock
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [{ id: "123" }] }),
      })
      .mockResolvedValueOnce(okResponse());

    await createHubSpotContact(submission);

    expect(proxyMock).toHaveBeenCalledTimes(3);
    const updateBody = parseBody(proxyMock.mock.calls[2]);
    expect(updateBody.properties[FORM_SOURCE_PROPERTY]).toBe(
      "Vertus Mexico Contact Us",
    );
  });

  it("stamps attribution properties when provided and confirmed by HubSpot", async () => {
    // 1-6) Ensure 6 attribution properties exist -> 200 OK for each
    for (let i = 0; i < 6; i++) {
      proxyMock.mockResolvedValueOnce(okResponse());
    }
    // 7) Create contact -> 200 OK
    proxyMock.mockResolvedValueOnce(okResponse());

    await createHubSpotContact({
      ...submission,
      attribution: {
        pagePath: "/mexico",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring_sale",
        utmTerm: "real estate",
        utmContent: "video_ad",
      },
    });

    // 6 property checks + 1 create
    expect(proxyMock).toHaveBeenCalledTimes(7);
    const createBody = parseBody(proxyMock.mock.calls[6]);
    expect(createBody.properties[LANDING_PAGE_PROPERTY]).toBe("/mexico");
    expect(createBody.properties[UTM_PROPERTIES.utmSource]).toBe("google");
    expect(createBody.properties[UTM_PROPERTIES.utmMedium]).toBe("cpc");
    expect(createBody.properties[UTM_PROPERTIES.utmCampaign]).toBe("spring_sale");
    expect(createBody.properties[UTM_PROPERTIES.utmTerm]).toBe("real estate");
    expect(createBody.properties[UTM_PROPERTIES.utmContent]).toBe("video_ad");
  });
});

describe("form_source registry", () => {
  it("recognizes every configured value and rejects unknown ones", () => {
    for (const value of Object.values(FORM_SOURCES)) {
      expect(isKnownFormSource(value)).toBe(true);
      expect(() => assertKnownFormSource(value)).not.toThrow();
    }

    expect(isKnownFormSource("Nope Not Real")).toBe(false);
    expect(() => assertKnownFormSource("Nope Not Real")).toThrow(
      /Unknown form_source value/,
    );
  });

  it("exposes the registry values as the allowed list", () => {
    expect([...FORM_SOURCE_VALUES].sort()).toEqual(
      Object.values(FORM_SOURCES).sort(),
    );
  });
});

describe("verifyFormSourceOptions", () => {
  beforeEach(() => {
    proxyMock.mockReset();
  });

  function propertyResponse(values: string[]) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ options: values.map((value) => ({ value })) }),
    };
  }

  it("passes when every registered value exists as a HubSpot dropdown option", async () => {
    proxyMock.mockResolvedValueOnce(
      propertyResponse([...FORM_SOURCE_VALUES, "Some Other Form"]),
    );

    await expect(verifyFormSourceOptions()).resolves.toBeUndefined();
  });

  it("throws loudly when a registered value is missing from HubSpot", async () => {
    proxyMock.mockResolvedValueOnce(propertyResponse(["Wrong Option Only"]));

    await expect(verifyFormSourceOptions()).rejects.toThrow(
      /missing option\(s\): "Vertus Mexico Contact Us"/,
    );
  });

  it("throws a clear error when the form_source property does not exist", async () => {
    proxyMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchFormSourceOptions()).rejects.toThrow(
      /property "form_source" does not exist/,
    );
  });
});

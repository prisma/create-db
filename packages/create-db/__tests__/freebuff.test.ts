import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDatabaseCore,
  readFreebuffClickId,
} from "../src/core/database.js";

const CLICK_ID = "bfc_1.signed-click.id";

describe("readFreebuffClickId", () => {
  it("reads the click id from PRISMA_FREEBUFF_BFCID exactly as received", () => {
    const longest = `bfc_${"a".repeat(508)}`;

    expect(readFreebuffClickId({ PRISMA_FREEBUFF_BFCID: CLICK_ID })).toBe(
      CLICK_ID
    );
    expect(readFreebuffClickId({ PRISMA_FREEBUFF_BFCID: longest })).toBe(
      longest
    );
  });

  it("ignores a missing, empty, too long or malformed value", () => {
    expect(readFreebuffClickId({})).toBeUndefined();
    expect(readFreebuffClickId({ PRISMA_FREEBUFF_BFCID: "" })).toBeUndefined();
    expect(
      readFreebuffClickId({ PRISMA_FREEBUFF_BFCID: `bfc_${"a".repeat(509)}` })
    ).toBeUndefined();
    expect(
      readFreebuffClickId({ PRISMA_FREEBUFF_BFCID: "not-a-click-id" })
    ).toBeUndefined();
  });
});

describe("createDatabaseCore with a Freebuff click id", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function mockCreateService() {
    return vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "proj_1",
              database: {
                name: "db",
                region: { id: "us-east-1" },
                connections: [
                  {
                    endpoints: {
                      direct: { connectionString: "postgres://example" },
                    },
                  },
                ],
              },
            },
          }),
          { status: 201 }
        )
    );
  }

  const createRequestBody = (fetchMock: ReturnType<typeof mockCreateService>) => {
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/create")
    );
    return JSON.parse((call?.[1] as RequestInit).body as string);
  };

  const create = () =>
    createDatabaseCore(
      "us-east-1",
      "https://create.example.com",
      "https://claim.example.com",
      "freebuff/agentic"
    );

  it("sends the click id in the create request body and nowhere else", async () => {
    vi.stubEnv("PRISMA_FREEBUFF_BFCID", CLICK_ID);
    const fetchMock = mockCreateService();

    const result = await create();

    expect(result.success).toBe(true);
    expect(createRequestBody(fetchMock).freebuffClickId).toBe(CLICK_ID);
    expect(JSON.stringify(result)).not.toContain(CLICK_ID);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).not.toContain(CLICK_ID);
      if (!String(url).endsWith("/create")) {
        expect(String((init as RequestInit | undefined)?.body)).not.toContain(
          CLICK_ID
        );
      }
    }
  });

  it("creates the database without a click id when the variable is not set", async () => {
    vi.stubEnv("PRISMA_FREEBUFF_BFCID", "");
    const fetchMock = mockCreateService();

    const result = await create();

    expect(result.success).toBe(true);
    expect(createRequestBody(fetchMock)).not.toHaveProperty("freebuffClickId");
  });

  it("creates the database and drops a malformed click id", async () => {
    vi.stubEnv("PRISMA_FREEBUFF_BFCID", "tampered value");
    const fetchMock = mockCreateService();

    const result = await create();

    expect(result.success).toBe(true);
    expect(createRequestBody(fetchMock)).not.toHaveProperty("freebuffClickId");
  });
});

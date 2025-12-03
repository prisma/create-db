import { intro, outro, cancel, select, spinner, log, isCancel } from "@clack/prompts";
import { createRouterClient, os } from "@orpc/server";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pc from "picocolors";
import terminalLink from "terminal-link";
import { createCli } from "trpc-cli";
import { z } from "zod";

import {
    type UserLocation,
    type Region,
    type RegionCoordinates,
    type CreateDatabaseResult,
    type DatabaseResult,
    type ApiResponse,
    type GeoLocationResponse,
    type RegionsResponse,
    type ProgrammaticCreateOptions,
    type RegionId,
    RegionSchema,
} from "./types.js";

export type {
    Region,
    RegionId,
    CreateDatabaseResult,
    DatabaseResult,
    ProgrammaticCreateOptions,
} from "./types.js";

export { isDatabaseError, isDatabaseSuccess, RegionSchema } from "./types.js";

dotenv.config({
    quiet: true
});

const CREATE_DB_WORKER_URL =
    process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";
const CLAIM_DB_WORKER_URL =
    process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io";

const REGION_COORDINATES: Record<RegionId, RegionCoordinates> = {
    "ap-southeast-1": { lat: 1.3521, lng: 103.8198 },
    "ap-northeast-1": { lat: 35.6762, lng: 139.6503 },
    "eu-central-1": { lat: 50.1109, lng: 8.6821 },
    "eu-west-3": { lat: 48.8566, lng: 2.3522 },
    "us-east-1": { lat: 38.9072, lng: -77.0369 },
    "us-west-1": { lat: 37.7749, lng: -122.4194 },
};

const pendingAnalytics: Promise<void>[] = [];

async function sendAnalytics(
    eventName: string,
    properties: Record<string, unknown>,
    cliRunId: string
): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const promise = (async () => {
        try {
            await fetch(`${CREATE_DB_WORKER_URL}/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventName,
                    properties: { distinct_id: cliRunId, ...properties },
                }),
                signal: controller.signal,
            });
        } catch {
            // Analytics failures should not block CLI
        } finally {
            clearTimeout(timer);
        }
    })();

    pendingAnalytics.push(promise);
}

async function flushAnalytics(maxWaitMs = 500): Promise<void> {
    if (pendingAnalytics.length === 0) return;
    await Promise.race([
        Promise.all(pendingAnalytics),
        new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
    ]);
}

function getCommandName(): string {
    const executable = process.argv[1] || "create-db";
    if (executable.includes("create-pg")) return "create-pg";
    if (executable.includes("create-postgres")) return "create-postgres";
    return "create-db";
}

async function detectUserLocation(): Promise<UserLocation | null> {
    try {
        const response = await fetch("https://ipapi.co/json/", {
            method: "GET",
            headers: { "User-Agent": "create-db-cli/1.0" },
        });

        if (!response.ok) return null;

        const data = (await response.json()) as GeoLocationResponse;
        return {
            country: data.country_code,
            continent: data.continent_code,
            city: data.city,
            region: data.region,
            latitude: data.latitude,
            longitude: data.longitude,
        };
    } catch {
        return null;
    }
}

function getRegionClosestToLocation(
    userLocation: { latitude?: number | string; longitude?: number | string } | null
): RegionId | null {
    if (!userLocation) return null;

    const userLat = parseFloat(String(userLocation.latitude));
    const userLng = parseFloat(String(userLocation.longitude));

    if (isNaN(userLat) || isNaN(userLng)) return null;

    let closestRegion: RegionId | null = null;
    let minDistance = Infinity;

    for (const [region, coordinates] of Object.entries(REGION_COORDINATES)) {
        const latDiff = ((userLat - coordinates.lat) * Math.PI) / 180;
        const lngDiff = ((userLng - coordinates.lng) * Math.PI) / 180;
        const a =
            Math.sin(latDiff / 2) ** 2 +
            Math.cos((userLat * Math.PI) / 180) *
            Math.cos((coordinates.lat * Math.PI) / 180) *
            Math.sin(lngDiff / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (distance < minDistance) {
            minDistance = distance;
            closestRegion = region as RegionId;
        }
    }

    return closestRegion;
}

function readUserEnvFile(): Record<string, string> {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return {};

    const envContent = fs.readFileSync(envPath, "utf8");
    const envVars: Record<string, string> = {};

    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
                const value = valueParts.join("=").replace(/^["']|["']$/g, "");
                envVars[key.trim()] = value.trim();
            }
        }
    }

    return envVars;
}

async function checkOnline(): Promise<void> {
    try {
        const res = await fetch(`${CREATE_DB_WORKER_URL}/health`);
        if (!res.ok) throw new Error("API not available");
    } catch {
        console.error(
            pc.bold(pc.red("\n✖ Error: Cannot reach Prisma Postgres API server.\n"))
        );
        console.error(
            pc.dim(
                `Check your internet connection or visit ${pc.green("https://www.prisma-status.com/")}\n`
            )
        );
        await flushAnalytics();
        process.exit(1);
    }
}

async function getRegions(): Promise<Region[]> {
    const res = await fetch(`${CREATE_DB_WORKER_URL}/regions`);

    if (!res.ok) {
        throw new Error(
            `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
        );
    }

    const data = (await res.json()) as RegionsResponse;
    const regions: Region[] = Array.isArray(data) ? data : (data.data ?? []);
    return regions.filter((region) => region.status === "available");
}

async function validateRegion(region: string): Promise<string> {
    const regions = await getRegions();
    const regionIds = regions.map((r) => r.id);

    if (!regionIds.includes(region)) {
        throw new Error(
            `Invalid region: ${region}. Available regions: ${regionIds.join(", ")}`
        );
    }

    return region;
}

async function createDatabaseCore(
    region: string,
    userAgent?: string,
    cliRunId?: string
): Promise<CreateDatabaseResult> {
    const name = new Date().toISOString();
    const runId = cliRunId ?? randomUUID();

    const resp = await fetch(`${CREATE_DB_WORKER_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            region,
            name,
            utm_source: getCommandName(),
            userAgent,
        }),
    });

    if (resp.status === 429) {
        void sendAnalytics(
            "create_db:database_creation_failed",
            { region, "error-type": "rate_limit", "status-code": 429 },
            runId
        );
        return {
            success: false,
            error: "rate_limit_exceeded",
            message:
                "We're experiencing a high volume of requests. Please try again later.",
            status: 429,
        };
    }

    let result: ApiResponse;
    let raw = "";
    try {
        raw = await resp.text();
        result = JSON.parse(raw) as ApiResponse;
    } catch {
        void sendAnalytics(
            "create_db:database_creation_failed",
            { region, "error-type": "invalid_json", "status-code": resp.status },
            runId
        );
        return {
            success: false,
            error: "invalid_json",
            message: "Unexpected response from create service.",
            raw,
            status: resp.status,
        };
    }

    if (result.error) {
        void sendAnalytics(
            "create_db:database_creation_failed",
            {
                region,
                "error-type": "api_error",
                "error-message": result.error.message,
            },
            runId
        );
        return {
            success: false,
            error: "api_error",
            message: result.error.message || "Unknown error",
            details: result.error,
            status: result.error.status ?? resp.status,
        };
    }

    const database = result.data?.database ?? result.databases?.[0];
    const projectId = result.data?.id ?? result.id ?? "";

    const apiKeys = database?.apiKeys;
    const directConnDetails = result.data
        ? apiKeys?.[0]?.directConnection
        : result.databases?.[0]?.apiKeys?.[0]?.ppgDirectConnection;

    const directUser = directConnDetails?.user
        ? encodeURIComponent(String(directConnDetails.user))
        : "";
    const directPass = directConnDetails?.pass
        ? encodeURIComponent(String(directConnDetails.pass))
        : "";
    const directHost = directConnDetails?.host;
    const directPort = directConnDetails?.port
        ? `:${directConnDetails.port}`
        : "";
    const directDbName = directConnDetails?.database || "postgres";

    const connectionString =
        directConnDetails && directHost
            ? `postgresql://${directUser}:${directPass}@${directHost}${directPort}/${directDbName}?sslmode=require`
            : null;

    const claimUrl = `${CLAIM_DB_WORKER_URL}/claim?projectID=${projectId}&utm_source=${userAgent || getCommandName()}&utm_medium=cli`;
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    void sendAnalytics(
        "create_db:database_created",
        { region, utm_source: getCommandName() },
        runId
    );

    return {
        success: true,
        connectionString,
        claimUrl,
        deletionDate: expiryDate.toISOString(),
        region: database?.region?.id || region,
        name: database?.name ?? name,
        projectId,
        userAgent,
    };
}

const router = os.router({
    create: os
        .meta({
            description: "Create a new Prisma Postgres database",
            default: true,
        })
        .input(
            z.object({
                region: RegionSchema.optional()
                    .describe("AWS region for the database")
                    .meta({ alias: "r" }),
                interactive: z
                    .boolean()
                    .optional()
                    .default(false)
                    .describe("Run in interactive mode to select a region")
                    .meta({ alias: "i" }),
                json: z
                    .boolean()
                    .optional()
                    .default(false)
                    .describe("Output machine-readable JSON")
                    .meta({ alias: "j" }),
                env: z
                    .string()
                    .optional()
                    .describe(
                        "Write DATABASE_URL and CLAIM_URL to the specified .env file"
                    )
                    .meta({ alias: "e" }),
            })
        )
        .handler(async ({ input }) => {
            const cliRunId = randomUUID();
            const CLI_NAME = getCommandName();

            let userAgent: string | undefined;
            const userEnvVars = readUserEnvFile();
            if (userEnvVars.PRISMA_ACTOR_NAME && userEnvVars.PRISMA_ACTOR_PROJECT) {
                userAgent = `${userEnvVars.PRISMA_ACTOR_NAME}/${userEnvVars.PRISMA_ACTOR_PROJECT}`;
            }

            void sendAnalytics(
                "create_db:cli_command_ran",
                {
                    command: CLI_NAME,
                    "has-region-flag": !!input.region,
                    "has-interactive-flag": input.interactive,
                    "has-json-flag": input.json,
                    "has-env-flag": !!input.env,
                    "has-user-agent-from-env": !!userAgent,
                    "node-version": process.version,
                    platform: process.platform,
                    arch: process.arch,
                },
                cliRunId
            );

            let region: RegionId = input.region ?? "us-east-1";

            if (!input.region) {
                const userLocation = await detectUserLocation();
                region = getRegionClosestToLocation(userLocation) ?? region;
            }

            const envPath = input.env;
            const envEnabled =
                typeof envPath === "string" && envPath.trim().length > 0;

            if (input.json || envEnabled) {
                if (input.interactive) {
                    await checkOnline();
                    const regions = await getRegions();

                    const selectedRegion = await select({
                        message: "Choose a region:",
                        options: regions.map((r) => ({ value: r.id, label: r.name || r.id })),
                        initialValue:
                            regions.find((r) => r.id === region)?.id || regions[0]?.id,
                    });

                    if (isCancel(selectedRegion)) {
                        cancel(pc.red("Operation cancelled."));
                        await flushAnalytics();
                        process.exit(0);
                    }

                    region = selectedRegion as RegionId;
                    void sendAnalytics(
                        "create_db:region_selected",
                        { region, "selection-method": "interactive" },
                        cliRunId
                    );
                } else if (input.region) {
                    await validateRegion(region);
                    void sendAnalytics(
                        "create_db:region_selected",
                        { region, "selection-method": "flag" },
                        cliRunId
                    );
                }

                await checkOnline();
                const result = await createDatabaseCore(region, userAgent, cliRunId);
                await flushAnalytics();

                if (input.json) {
                    console.log(JSON.stringify(result, null, 2));
                    return;
                }

                if (!result.success) {
                    console.error(result.message);
                    process.exit(1);
                }

                try {
                    const targetEnvPath = envPath!;
                    const lines = [
                        `DATABASE_URL="${result.connectionString ?? ""}"`,
                        `CLAIM_URL="${result.claimUrl}"`,
                        "",
                    ];

                    let prefix = "";
                    if (fs.existsSync(targetEnvPath)) {
                        const existing = fs.readFileSync(targetEnvPath, "utf8");
                        if (existing.length > 0 && !existing.endsWith("\n")) {
                            prefix = "\n";
                        }
                    }

                    fs.appendFileSync(targetEnvPath, prefix + lines.join("\n"), {
                        encoding: "utf8",
                    });

                    console.log(
                        pc.green(`Wrote DATABASE_URL and CLAIM_URL to ${targetEnvPath}`)
                    );
                } catch (err) {
                    console.error(
                        pc.red(
                            `Failed to write environment variables to ${envPath}: ${err instanceof Error ? err.message : String(err)
                            }`
                        )
                    );
                    process.exit(1);
                }

                return;
            }

            await checkOnline();

            intro(pc.bold(pc.cyan("🚀 Creating a Prisma Postgres database")));

            if (input.interactive) {
                const regions = await getRegions();

                const selectedRegion = await select({
                    message: "Choose a region:",
                    options: regions.map((r) => ({ value: r.id, label: r.name || r.id })),
                    initialValue:
                        regions.find((r) => r.id === region)?.id || regions[0]?.id,
                });

                if (isCancel(selectedRegion)) {
                    cancel(pc.red("Operation cancelled."));
                    await flushAnalytics();
                    process.exit(0);
                }

                region = selectedRegion as RegionId;
                void sendAnalytics(
                    "create_db:region_selected",
                    { region, "selection-method": "interactive" },
                    cliRunId
                );
            } else if (input.region) {
                await validateRegion(region);
                void sendAnalytics(
                    "create_db:region_selected",
                    { region, "selection-method": "flag" },
                    cliRunId
                );
            }

            const s = spinner();
            s.start(`Creating database in ${pc.cyan(region)}...`);

            const result = await createDatabaseCore(region, userAgent, cliRunId);

            if (!result.success) {
                s.stop(pc.red(`Error: ${result.message}`));
                await flushAnalytics();
                process.exit(1);
            }

            s.stop(pc.green("Database created successfully!"));

            const expiryFormatted = new Date(result.deletionDate).toLocaleString();
            const clickableUrl = terminalLink(result.claimUrl, result.claimUrl, {
                fallback: false,
            });

            log.message("");
            log.info(pc.bold("Database Connection"));
            log.message("");

            if (result.connectionString) {
                log.message(pc.cyan("  Connection String:"));
                log.message("  " + pc.yellow(result.connectionString));
                log.message("");
            } else {
                log.warning(pc.yellow("  Connection details are not available."));
                log.message("");
            }

            log.success(pc.bold("Claim Your Database"));
            log.message(pc.cyan("  Keep your database for free:"));
            log.message("  " + pc.yellow(clickableUrl));
            log.message(
                pc.italic(pc.dim(`  Database will be deleted on ${expiryFormatted} if not claimed.`))
            );

            outro(pc.dim("Done!"));
            await flushAnalytics();
        }),

    regions: os
        .meta({ description: "List available Prisma Postgres regions" })
        .handler(async (): Promise<void> => {
            const regions = await getRegions();

            log.message("");
            log.info(pc.bold(pc.cyan("Available Prisma Postgres regions:")));
            log.message("");
            for (const r of regions) {
                log.message(`  ${pc.green(r.id)} - ${r.name || r.id}`);
            }
            log.message("");
        }),
});

export function createDbCli() {
    return createCli({
        router,
        name: getCommandName(),
        version: "1.1.0",
        description: "Instantly create a temporary Prisma Postgres database",
    });
}

const caller = createRouterClient(router, { context: {} });

/**
 * Create a new Prisma Postgres database programmatically.
 *
 * @example
 * ```typescript
 * import { create } from "create-db";
 *
 * const result = await create({ region: "us-east-1" });
 *
 * if (result.success) {
 *   console.log(`Connection string: ${result.connectionString}`);
 *   console.log(`Claim URL: ${result.claimUrl}`);
 * }
 * ```
 */
export async function create(
    options?: ProgrammaticCreateOptions
): Promise<CreateDatabaseResult> {
    return createDatabaseCore(options?.region || "us-east-1", options?.userAgent);
}

/**
 * List available Prisma Postgres regions programmatically.
 *
 * @example
 * ```typescript
 * import { regions } from "create-db";
 *
 * const availableRegions = await regions();
 * console.log(availableRegions);
 * ```
 */
export async function regions(): Promise<Region[]> {
    return getRegions();
}

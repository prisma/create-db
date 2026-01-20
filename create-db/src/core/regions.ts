import pc from "picocolors";
import type { Region, RegionsResponse } from "../types.js";

export async function checkOnline(workerUrl: string): Promise<void> {
  try {
    const res = await fetch(`${workerUrl}/health`);
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
    throw new Error("Cannot reach API server");
  }
}

export async function getRegions(workerUrl: string): Promise<Region[]> {
  const res = await fetch(`${workerUrl}/regions`);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch regions. Status: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as RegionsResponse;
  const regions: Region[] = Array.isArray(data) ? data : (data.data ?? []);
  return regions.filter((region) => region.status === "available");
}

export async function validateRegion(
  region: string,
  workerUrl: string
): Promise<string> {
  const regions = await getRegions(workerUrl);
  const regionIds = regions.map((r) => r.id);

  if (!regionIds.includes(region)) {
    throw new Error(
      `Invalid region: ${region}. Available regions: ${regionIds.join(", ")}`
    );
  }

  return region;
}

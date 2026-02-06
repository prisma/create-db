import { log } from "@clack/prompts";
import pc from "picocolors";

import type { RegionsFlagsInput } from "../flags.js";
import { fetchRegions } from "../../core/services.js";
import { printJson } from "../output.js";

export async function handleRegions(input: RegionsFlagsInput): Promise<void> {
  const regions = await fetchRegions();

  if (input.json) {
    printJson(regions);
    return;
  }

  log.message("");
  log.info(pc.bold(pc.cyan("Available Prisma Postgres regions:")));
  log.message("");
  for (const r of regions) {
    log.message(`  ${pc.green(r.id)} - ${r.name || r.id}`);
  }
  log.message("");
}

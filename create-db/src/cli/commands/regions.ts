import { log } from "@clack/prompts";
import pc from "picocolors";

import { fetchRegions } from "../../core/services.js";

export async function handleRegions(): Promise<void> {
  const regions = await fetchRegions();

  log.message("");
  log.info(pc.bold(pc.cyan("Available Prisma Postgres regions:")));
  log.message("");
  for (const r of regions) {
    log.message(`  ${pc.green(r.id)} - ${r.name || r.id}`);
  }
  log.message("");
}

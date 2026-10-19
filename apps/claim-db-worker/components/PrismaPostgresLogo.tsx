import { RoleKicker } from "@/components/brand/Brand";

// The brand has no separate Prisma Postgres lockup: the product is named with
// a role kicker (Postgres owns cyan) and the Prisma logo stays in the navbar.
export function PrismaPostgresLogo() {
  return <RoleKicker className="mb-4">Prisma Postgres</RoleKicker>;
}

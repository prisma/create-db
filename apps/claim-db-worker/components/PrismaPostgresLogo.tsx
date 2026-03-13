import Image from "next/image";

export function PrismaPostgresLogo() {
  return (
    <div className="mb-8 w-fit">
      <Image
        src="/prisma-postgres-logo.svg"
        alt="Prisma Postgres Logo"
        width={250}
        height={100}
        className="w-40 sm:w-56 md:w-64 lg:w-64 h-auto"
      />
    </div>
  );
}

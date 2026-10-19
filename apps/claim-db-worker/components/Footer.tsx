import Image from "next/image";

const SOCIALS = [
  { href: "https://pris.ly/discord", src: "/discord.svg", alt: "Discord" },
  { href: "https://pris.ly/x", src: "/xtwitter.svg", alt: "X (Twitter)" },
  { href: "https://pris.ly/youtube", src: "/youtube.svg", alt: "YouTube" },
  { href: "https://pris.ly/github", src: "/github.svg", alt: "GitHub" },
];

export function Footer() {
  return (
    // mt-auto pins the footer to the bottom on short pages; the wrapper's
    // padding keeps it off the panels above on tall ones.
    <div className="mt-auto w-full pt-24">
      <footer className="w-full border-t border-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 pt-10 text-center sm:flex-row sm:gap-0 sm:px-8">
          <a target="_blank" rel="noopener noreferrer" href="https://prisma.io">
            <Image src="/brand/logo.svg" alt="Prisma logo" width={106} height={27} />
          </a>
          <div className="flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-1.5 transition-colors hover:bg-black/[0.04]"
              >
                <Image src={s.src} width={24} height={24} alt={s.alt} />
              </a>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col items-center justify-between gap-6 border-t border-border px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:gap-0 sm:px-8">
          <span>© {new Date().getFullYear()} Prisma Data, Inc.</span>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 sm:gap-14">
            <Image src="/gdpr.svg" alt="GDPR" width={35} height={35} />
            <Image src="/hipaa.svg" alt="HIPAA" width={62} height={30} />
            <Image src="/iso27.svg" alt="ISO 27001" width={73} height={27} />
            <Image src="/soc2.svg" alt="SOC 2" width={60} height={28} />
          </div>
        </div>
      </footer>
    </div>
  );
}

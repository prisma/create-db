import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full box-border overflow-hidden mt-32 md:mt-auto mb-8">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center flex-col text-center gap-6 sm:flex-row sm:gap-0 px-4 md:px-4 sm:px-4">
        <a target="_blank" rel="opener noferrer" href="https://prisma.io">
          <Image
            src="/logo-dark.svg"
            alt="Prisma logo"
            width={100}
            height={100}
          />
        </a>
        <div className="flex gap-4 md:gap-5 sm:gap-4">
          <a
            href="https://pris.ly/discord"
            target="_blank"
            rel="opener noferrer"
          >
            <Image
              src="/discord.svg"
              width="30"
              height="30"
              alt="Discord logo"
            />
          </a>
          <a href="https://pris.ly/x" target="_blank" rel="opener noferrer">
            <Image
              src="/xtwitter.svg"
              width="30"
              height="30"
              alt="Twitter/X logo"
            />
          </a>
          <a
            href="https://pris.ly/youtube"
            target="_blank"
            rel="opener noferrer"
          >
            <Image
              src="/youtube.svg"
              width="30"
              height="30"
              alt="Youtube logo"
            />
          </a>
          <a
            href="https://pris.ly/github"
            target="_blank"
            rel="opener noferrer"
          >
            <Image src="/github.svg" width="30" height="30" alt="Github logo" />
          </a>
        </div>
      </div>
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center mt-8 pt-8 border-t border-[#2D3748] flex-col text-center gap-6 sm:flex-row sm:gap-0 sm:mt-6 sm:pt-6 px-4 md:px-4 sm:px-4">
        <span>© 2024 Prisma Data, Inc.</span>
        <div className="flex gap-6 md:gap-8 flex-wrap justify-center sm:gap-14">
          <Image src="/gdpr.svg" alt="GDPR Logo" width="35" height="35" />
          <Image src="/hipaa.svg" alt="HIPAA Logo" width="62" height="30" />
          <Image src="/iso27.svg" alt="ISO27 Logo" width="73" height="27" />
          <Image src="/soc2.svg" alt="SOC2 Logo" width="60" height="28" />
        </div>
      </div>
    </footer>
  );
}

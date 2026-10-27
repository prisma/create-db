import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { CodeSnippet } from "@/components/CodeSnippet";
import { PrismButton } from "@/components/brand/PrismButton";
import { PrismRay, RoleKicker, SpectralWash, Texture } from "@/components/brand/Brand";
import {
  Globe,
  Zap,
  ArrowRightLeft,
  Database,
  Sparkles,
  ArrowRight,
  Terminal,
  LayoutDashboard,
  Laptop,
} from "lucide-react";
import { ClientRedirect } from "../components/ClientRedirect";
import Link from "next/link";

// The three prism colours, in brand order, for anything that comes in threes.
const PRISM_DOTS = ["bg-prism-cyan-400", "bg-prism-yellow-300", "bg-prism-red-500"];
const PRISM_BORDERS = [
  "border-t-prism-cyan-400",
  "border-t-prism-yellow-300",
  "border-t-prism-red-500",
];

const steps = [
  {
    title: "Create your database",
    description: (
      <>
        Use the{" "}
        <Link href="/web/connect" className="font-semibold text-ink underline-offset-4 hover:underline">
          web interface
        </Link>{" "}
        or run <code className="font-mono text-[0.9em] font-semibold text-ink">npx create-db@latest</code>{" "}
        to get a Prisma Postgres database instantly. No account or setup required.
      </>
    ),
  },
  {
    title: "Connect and use",
    description:
      "Get your connection string and start building. Perfect for development, testing, prototypes, and AI applications.",
  },
  {
    title: "Keep it forever",
    description: (
      <>
        Claim your database to your Prisma account to keep it permanently. Unclaimed databases
        expire after 24 hours.
      </>
    ),
  },
];

const featuresTable = [
  {
    icon: Globe,
    title: "Global deployment",
    description: "Deploy in regions closest to your users for optimal performance",
  },
  {
    icon: Zap,
    title: "Instant provisioning",
    description: "Get a fully configured PostgreSQL database in seconds",
  },
  {
    icon: ArrowRightLeft,
    title: "Seamless migration",
    description: "One-click transfer to your Prisma account when ready",
  },
  {
    icon: Sparkles,
    title: "Zero configuration",
    description: "No setup, no accounts, no credit cards required",
  },
];

const features = [
  {
    icon: Zap,
    title: "Instant database",
    description: "Get a database with just one command",
  },
  {
    icon: Terminal,
    title: "Terminal ready",
    description: "Perfect for scripts and CI/CD pipelines",
  },
  {
    icon: Sparkles,
    title: "No configuration needed",
    description: "Zero setup required, just run and connect",
  },
];

const featuresWebOnly = [
  {
    icon: Laptop,
    title: "Interactive web interface",
    description: "Interact with your database directly in the browser",
  },
  {
    icon: Database,
    title: "Visual schema editor",
    description: "Design your database schema with the built-in editor",
  },
  {
    icon: LayoutDashboard,
    title: "Prisma Studio",
    description: "Manage your data with the built-in database client",
  },
];

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function HomePageContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="w-full">
      <ClientRedirect searchParams={resolvedSearchParams} />

      {/* Hero: the site's wrapped prismatic panel — spectral wash along the
          bottom, grain, and the triple-band ray passing behind the console. */}
      <section className="px-3 sm:px-4">
        <div className="relative mx-auto max-w-[96rem] overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white">
          <SpectralWash />
          <Texture />

          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-8 md:pb-28 md:pt-24">
            <div className="flex animate-hero-rise flex-col items-center motion-reduce:animate-none">
              <PrismaPostgresLogo />
              <h1 className="max-w-[18ch] text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.06]">
                Get a free, instant Prisma Postgres database
              </h1>
              <p className="mt-6 max-w-[48ch] text-pretty text-lg leading-relaxed text-muted-foreground">
                No account or config needed. Spin one up in the browser or from your terminal, and
                claim it when you want to keep it.
              </p>
            </div>

            <div className="relative mt-12 w-full max-w-4xl">
              <PrismRay
                className="hidden sm:block left-1/2 top-1/2 h-12 w-[48rem] -translate-x-1/2 -translate-y-1/2 md:h-20 md:w-[72rem]"
                intensity="hero"
              />
              <div className="relative grid grid-cols-1 gap-8 rounded-2xl border border-black/[0.06] bg-white p-6 text-left shadow-sm sm:p-8 md:grid-cols-2">
                <div>
                  <RoleKicker color="bg-prism-cyan-400">Web interface</RoleKicker>
                  <div className="mt-4 h-14">
                    <PrismButton href="/web/connect" fullWidth className="h-full">
                      <span className="sm:hidden">Use the web interface</span>
                      <span className="hidden sm:inline">Create with the web interface</span>
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </PrismButton>
                  </div>
                </div>
                <div>
                  <RoleKicker color="bg-prism-yellow-300">Command line</RoleKicker>
                  <div className="mt-4 h-14">
                    <CodeSnippet />
                  </div>
                </div>
              </div>
            </div>

            <p className="relative mt-6 text-sm text-muted-foreground">
              Databases are deleted after 24 hours unless claimed.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeader kicker="Features" title="Everything you need to start building" />
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {features.map((feature) => (
                <FeatureRow key={feature.title} {...feature} />
              ))}
            </div>
            <div className="space-y-4">
              {featuresWebOnly.map((feature) => (
                <FeatureRow key={feature.title} {...feature} webOnly />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-20 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader kicker="How it works" kickerColor="bg-prism-yellow-300" title="Three steps, zero setup" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`rounded-2xl border border-black/[0.06] border-t-2 ${PRISM_BORDERS[index]} bg-white p-6`}
              >
                <p className="font-mono text-sm text-muted-foreground">0{index + 1}</p>
                <h3 className="mt-3 text-xl">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {featuresTable.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-black/[0.06] bg-paper p-6 transition-colors hover:border-black/[0.12]"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${PRISM_DOTS[index % PRISM_DOTS.length]}`}
                  />
                  <feature.icon className="h-5 w-5 text-ink" aria-hidden />
                  <span className="font-semibold text-ink">{feature.title}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-2xl text-left md:text-center">
            <RoleKicker color="bg-prism-red-500" className="md:justify-center">
              How it&apos;s made
            </RoleKicker>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              create-db utilizes the power of the Prisma Postgres Management API to create and
              manage your database. If you&apos;d like to build something similar, see the{" "}
              <a
                href="https://www.prisma.io/partners"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink underline underline-offset-4 decoration-prism-cyan-400 decoration-2 hover:decoration-ink"
              >
                Prisma Partners page
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  kicker,
  kickerColor = "bg-prism-cyan-400",
  title,
}: {
  kicker: string;
  kickerColor?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-start text-left md:items-center md:text-center">
      <RoleKicker color={kickerColor}>{kicker}</RoleKicker>
      <h2 className="mt-4 max-w-[24ch] text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.1]">
        {title}
      </h2>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  webOnly = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  webOnly?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-ink">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-base">{title}</h3>
          {webOnly && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
              <span aria-hidden className="size-1.5 rounded-full bg-prism-cyan-400" />
              Web only
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <HomePageContent searchParams={searchParams} />;
}

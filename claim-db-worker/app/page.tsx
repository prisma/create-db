import Image from "next/image";
import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { CodeSnippet } from "@/components/CodeSnippet";
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
  Pencil,
  Puzzle,
} from "lucide-react";
import { ClientRedirect } from "../components/ClientRedirect";
import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Create your database",
    description: (
      <>
        Use the{" "}
        <Link
          href="/web/connect"
          className="text-white font-bold hover:underline"
        >
          web interface
        </Link>{" "}
        or run{" "}
        <span className="text-white font-bold">npx create-db@latest</span> to
        get a Prisma Postgres database instantly. No account or setup required.
      </>
    ),
  },
  {
    number: "2",
    title: "Connect and use",
    description:
      "Get your connection string and start building. Perfect for development, testing, prototypes, and AI applications.",
  },
  {
    number: "3",
    title: "Keep it forever",
    description: (
      <>
        Claim your database to your Prisma account to keep it permanently.{" "}
        <span className="italic">
          Unclaimed databases expire after 24 hours.
        </span>
      </>
    ),
  },
];

const featuresTable = [
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Global deployment",
    description:
      "Deploy in regions closest to your users for optimal performance",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant provisioning",
    description: "Get a fully configured PostgreSQL database in seconds",
  },
  {
    icon: <ArrowRightLeft className="w-5 h-5" />,
    title: "Seamless migration",
    description: "One-click transfer to your Prisma account when ready",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Zero configuration",
    description: "No setup, no accounts, no credit cards required",
  },
];

const features = [
  {
    icon: <Zap className="w-5 h-5 text-brand-surface-highlight" />,
    title: "Instant Database",
    description: "Get a database with just one command",
    webOnly: false,
  },
  {
    icon: <Terminal className="w-5 h-5 text-brand-surface-highlight" />,
    title: "Terminal Ready",
    description: "Perfect for scripts and CI/CD pipelines",
    webOnly: false,
  },
  {
    icon: <Sparkles className="w-5 h-5 text-brand-surface-highlight" />,
    title: "No Configuration Needed",
    description: "Zero setup required, just run and connect",
    webOnly: false,
  },
];

const featuresWebOnly = [
  {
    icon: <Laptop className="w-5 h-5 text-brand-surface-highlight" />,
    title: "Interactive Web Interface",
    description: "Interact with your database directly in the browser",
    webOnly: true,
  },

  {
    icon: <Database className="w-5 h-5 text-brand-surface-highlight" />,
    title: "Visual Schema Editor",
    description: "Design your database schema with the built-in editor",
    webOnly: true,
  },
  {
    icon: <LayoutDashboard className="w-5 h-5 text-brand-surface-highlight" />,
    title: "Prisma Studio",
    description: "Manage your data with the built-in database client",
    webOnly: true,
  },
];

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function HomePageContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="text-foreground">
      <ClientRedirect searchParams={resolvedSearchParams} />
      <div className="flex flex-col items-center text-center max-w-6xl w-full px-4 sm:px-6">
        <PrismaPostgresLogo />

        <PillBadge />

        <h1 className="text-3xl font-[800] text-white mb-6 tracking-tight sm:text-3xl md:text-4xl lg:text-6xl">
          Get a free, instant Prisma Postgres database
        </h1>

        <div className="w-full max-w-4xl mx-auto mt-8 mb-12">
          <div className="bg-card/80 p-4 sm:p-8 rounded-xl border border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-2 sm:gap-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-brand-surface-highlight" />
                  <h2 className="text-2xl font-bold text-white">
                    Web Interface
                  </h2>
                </div>
                <Link
                  href="/web/connect"
                  className="h-16 mb-8 w-full flex items-center justify-center gap-3 bg-button-blue hover:bg-button-blue-hover text-white font-bold text-lg rounded-lg px-6 py-3 cursor-pointer transition-all duration-200"
                >
                  <span className="sm:hidden">Use the Web Interface</span>
                  <span className="hidden sm:block">
                    Create with the Web Interface
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Terminal className="w-6 h-6 text-brand-surface-highlight" />
                  <h2 className="text-2xl font-bold text-white">
                    Command Line
                  </h2>
                </div>
                <div className="h-16">
                  <CodeSnippet />
                </div>
              </div>
            </div>

            <div className="my-6 mt-10 sm:my-6 flex items-center justify-center gap-2 w-full">
              <Puzzle className="w-5 h-5 text-brand-surface-highlight" />
              <h1 className="text-white font-bold text-2xl">Features</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-step/30 rounded-lg border border-subtle"
                  >
                    <div className="mt-0.5 flex-shrink-0">{feature.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-muted text-sm mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {featuresWebOnly.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-step/30 rounded-lg border border-subtle"
                  >
                    <div className="mt-0.5 flex-shrink-0">{feature.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {feature.title}
                        </h3>
                        <span className="text-xs bg-brand-surface-highlight/20 text-brand-surface-highlight px-2 py-0.5 rounded-full">
                          Web Only
                        </span>
                      </div>
                      <p className="text-muted text-sm mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted italic text-center max-w-2xl px-2 sm:text-xs md:text-xs lg:text-sm">
          databases will be deleted in 24 hours unless claimed
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-2xl mx-auto sm:gap-8 sm:py-10 md:py-16 md:px-5 lg:gap-10 lg:py-32 lg:px-6">
        <div className="flex flex-col gap-4 w-full sm:gap-7 md:gap-7 lg:gap-8">
          {steps.map((step, index) => (
            <Step key={index} step={step} />
          ))}
          <FeaturesTable />
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="bg-step rounded text-white font-bold w-7 h-7 flex items-center justify-center sm:w-7 md:w-8 lg:w-9 sm:text-base md:text-lg lg:text-xl">
                <Pencil
                  width={20}
                  height={20}
                  className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
                />
              </div>
              <div className="text-white uppercase font-bold sm:text-base md:text-lg lg:text-xl">
                How it's made
              </div>
            </div>
            <div className="text-muted ml-8 sm:ml-10 md:ml-11 lg:ml-12 md:text-base lg:text-lg">
              create-db utilizes the power of the Prisma Postgres Management API
              to create and manage your database. If you'd like to buid
              something similar, see the{" "}
              <a
                href="https://www.prisma.io/partners"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-surface-highlight hover:underline"
              >
                Prisma Partners page
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PillBadge() {
  return (
    <div className="rounded-full p-px bg-gradient-to-b from-gradient-start to-gradient-end mb-8">
      <div className="rounded-full px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-2 font-bold bg-card">
        <Image
          src="/magic-wand-icon.svg"
          alt="Magic Wand Icon"
          width={20}
          height={20}
          className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
        />
        <p className="uppercase font-extrabold text-white text-sm sm:text-base">
          No account or config needed
        </p>
      </div>
    </div>
  );
}

function Step({ step }: { step: (typeof steps)[0] }) {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className="bg-step rounded text-white font-bold w-7 h-7 flex items-center justify-center sm:w-7 md:w-8 lg:w-9 sm:text-base md:text-lg lg:text-xl">
          {step.number}
        </div>
        <div className="text-white uppercase font-bold sm:text-base md:text-lg lg:text-xl">
          {step.title}
        </div>
      </div>
      <div className="text-muted ml-8 sm:ml-10 md:ml-11 lg:ml-12 md:text-base lg:text-lg">
        {step.description}
      </div>
    </div>
  );
}

function FeaturesTable() {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className="bg-step rounded text-white font-bold w-7 h-7 flex items-center justify-center sm:w-7 md:w-8 lg:w-9 sm:text-base md:text-lg lg:text-xl">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-white uppercase font-bold sm:text-base md:text-lg lg:text-xl">
          Features
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8 sm:ml-10 md:ml-11 lg:ml-12">
        {featuresTable.map((feature, index) => (
          <div
            key={index}
            className="bg-step rounded-lg p-4 border border-subtle hover:border-brand-surface-highlight/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-brand-surface-highlight">{feature.icon}</div>
              <span className="text-white font-bold">{feature.title}</span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
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

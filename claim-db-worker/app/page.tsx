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
        <Link href="/web" className="text-white font-bold hover:underline">
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

const features = [
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-8 mb-12">
          <div className="bg-card/60 p-6 rounded-xl border border-subtle relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 text-sm font-bold px-2 py-1 rounded">
              RECOMMENDED
            </div>
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-brand-surface-highlight" />
              <h2 className="text-2xl font-bold text-white">Web Interface</h2>
            </div>
            <Link
              href="/web"
              className="h-16 mb-6 w-full flex items-center justify-center gap-3 bg-[#24bfa7] hover:bg-[#16A394] text-white font-bold text-lg rounded-lg px-6 py-3 cursor-pointer shadow-lg transition-all duration-200"
            >
              Create with the Web Interface
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">
                    Visual Schema Editor
                  </h3>
                  <p className="text-muted text-sm">
                    Design your database schema with an intuitive UI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LayoutDashboard className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Prisma Studio</h3>
                  <p className="text-muted text-sm">
                    Manage your data with the built-in database client
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Laptop className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Interactive</h3>
                  <p className="text-muted text-sm">
                    Interact with your database directly from the web interface
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CLI Column */}
          <div className="bg-card/60 p-6 rounded-xl border border-subtle relative">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-6 h-6 text-brand-surface-highlight" />
              <h2 className="text-2xl font-bold text-white">Command Line</h2>
            </div>
            <div className="h-16 mb-6">
              <CodeSnippet />
            </div>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <Terminal className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">
                    Terminal Workflows
                  </h3>
                  <p className="text-muted text-sm">
                    For developers who prefer command-line tools
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Quick Start</h3>
                  <p className="text-muted text-sm">
                    Get started with a single command
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRightLeft className="w-5 h-5 text-brand-surface-highlight mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">
                    All Web Features Included
                  </h3>
                  <p className="text-muted text-sm">
                    Access everything via CLI that you can in the web interface
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Web Interface Column */}
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
        {features.map((feature, index) => (
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

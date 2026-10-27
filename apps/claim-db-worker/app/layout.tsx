import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { DropProvider } from "./contexts/DropContext";
import { Toaster } from "react-hot-toast";
import { PostHogProvider } from "@/components/PostHogProvider";

// Brand type: Sora for headings, Inter for everything else.
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://create-db.prisma.io/"),
  title: "Prisma Postgres Create DB",
  description:
    "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
  openGraph: {
    title: "Want a free, instant Prisma Postgres database?",
    description:
      "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
    images: ["/og-card.png"],
    type: "website",
    url: "https://create-db.prisma.io/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Want a free, instant Prisma Postgres database?",
    description:
      "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
    images: ["/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-screen w-full p-0">
        <Script
          async
          src="https://cdn.tolt.io/tolt.js"
          data-tolt="fda67739-7ed0-42d2-b716-6da0edbec191"
        />
        <Toaster toastOptions={{ duration: 4000 }} />
        <PostHogProvider>
          <DropProvider>
            <div className="mx-auto flex min-h-screen w-full flex-col items-center">
              <Navbar />
              {children}
              <Footer />
            </div>
          </DropProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

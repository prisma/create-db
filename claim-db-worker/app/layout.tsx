import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { DropProvider } from "./contexts/DropContext";
import { Toaster } from "react-hot-toast";

const barlow = Barlow({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Prisma Postgres Create DB",
  description:
    "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
  openGraph: {
    title: "Want a free, instant Prisma Postgres database?",
    description:
      "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
    images: ["/og-image.png"],
    type: "website",
    url: "https://create-db.prisma.io/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Want a free, instant Prisma Postgres database?",
    description:
      "Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db.",
    images: ["/og-image.png"],
  },
  icons: {
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.className} antialiased bg-custom-gradient backdrop-filter backdrop-blur-md bg-cover font-barlow text-white p-0 min-h-screen w-full`}
      >
        <Toaster toastOptions={{ duration: 4000 }} />
        <DropProvider>
          <div className="flex items-center justify-center flex-col min-h-screen max-w-screen-xl mx-auto w-full">
            <Navbar />
            {children}
            <Footer />
          </div>
        </DropProvider>
      </body>
    </html>
  );
}

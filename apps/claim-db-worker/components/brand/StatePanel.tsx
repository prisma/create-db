import { SpectralWash, Texture } from "@/components/brand/Brand";

// The centred single-message pages (claim, success, error): the site's
// wrapped prismatic panel at a smaller scale, so every state reads as part of
// the same surface as the homepage hero.
export function StatePanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="w-full px-3 sm:px-4">
      <div className="relative mx-auto max-w-[96rem] overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white">
        <SpectralWash />
        <Texture />
        <div
          className={`relative mx-auto flex max-w-3xl animate-hero-rise flex-col items-center px-4 py-20 text-center motion-reduce:animate-none sm:px-8 md:py-28 ${className}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

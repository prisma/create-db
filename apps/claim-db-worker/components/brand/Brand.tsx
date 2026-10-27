import Image from "next/image";

// Small brand primitives ported from the prisma.io site (components/brand/*).
// Keep them visually in step with the originals.

/** The canonical triple-band ray: cyan / yellow / red brand anchors. */
const BANDS =
  "linear-gradient(to bottom, var(--color-prism-cyan-400) 0% 33%, var(--color-prism-yellow-300) 33% 66%, var(--color-prism-red-500) 66% 100%)";

const RAY_INTENSITY = {
  whisper: { opacity: 0.3, blur: 3 },
  structural: { opacity: 0.6, blur: 1 },
  hero: { opacity: 0.9, blur: 0.5 },
} as const;

// The brand motif: light crossing the frame as a triple-band prism ray. It
// marks where something is happening — a state, never a static stripe.
// Size and position via className; the brand angle is -16deg.
export function PrismRay({
  className = "",
  angle = -16,
  intensity = "structural",
}: {
  className?: string;
  angle?: number;
  intensity?: keyof typeof RAY_INTENSITY;
}) {
  const { opacity, blur } = RAY_INTENSITY[intensity];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{
        rotate: `${angle}deg`,
        opacity,
        filter: `blur(${blur}px)`,
        background: BANDS,
        maskImage:
          "linear-gradient(to right, transparent 2%, black 18%, black 82%, transparent 98%)",
      }}
    />
  );
}

// Brand film grain. Drop inside any `relative` container; 0.06 multiply is
// the site standard on colour-washed panels.
export function Texture({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/texture.jpg"
        alt=""
        className="h-full w-full object-cover"
        style={{ opacity, mixBlendMode: "multiply" }}
      />
    </div>
  );
}

// The spectral wash from the brand kit's panels: colour pooled along the
// bottom edge, faded back to paper above. (The site's full-height heroes push
// the gradient centres further below the edge; on panels this short that
// variant clips to nothing, so this is the brand-kit mascot-panel variant.)
export function SpectralWash({ className = "h-2/3" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(58% 78% at 22% 108%, color-mix(in srgb, var(--color-prism-cyan-400) 40%, transparent), transparent 70%)",
            "radial-gradient(52% 70% at 54% 116%, color-mix(in srgb, var(--color-prism-yellow-300) 34%, transparent), transparent 68%)",
            "radial-gradient(52% 72% at 86% 108%, color-mix(in srgb, var(--color-prism-red-400) 36%, transparent), transparent 70%)",
          ].join(","),
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-t from-transparent to-white" />
    </div>
  );
}

// Role kicker — the brand's replacement for coloured pills (pills are
// reserved for buttons): the colour lives in a small dot, the label stays ink.
// Sentence case, never uppercase.
export function RoleKicker({
  color = "bg-prism-cyan-400",
  className = "",
  children,
}: {
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`flex items-center gap-2 text-sm font-semibold text-foreground/70 ${className}`}>
      <span aria-hidden className={`size-2 rounded-full ${color}`} />
      {children}
    </p>
  );
}

// Prismo, the mascot. One expression per surface, matched to the message
// (brand-kit rules) — never as a logo stand-in.
export type MascotExpression = "happy" | "sad" | "thinking" | "salute";

export function Mascot({
  expression,
  alt,
  className = "w-32",
}: {
  expression: MascotExpression;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={`/brand/mascot/${expression}.png`}
      alt={alt}
      width={320}
      height={320}
      // Pre-sized in public/; the worker has no image-optimization binding.
      unoptimized
      className={`h-auto drop-shadow-[0_10px_16px_rgba(21,21,21,0.18)] ${className}`}
    />
  );
}

// The prism symbol as a pulsing loading mark.
export function LoadingMark({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mark.svg"
        alt=""
        aria-hidden
        className="size-12 animate-pulse motion-reduce:animate-none"
      />
      <p className="mt-4 px-4 text-lg text-muted-foreground">{label}</p>
    </div>
  );
}

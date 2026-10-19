import Link from "next/link";

const SPECTRUM =
  "linear-gradient(85deg, #01d7e4 0%, #f3c306 25%, #f37a03 50%, #f43531 74%, #f00e5c 100%)";

const SIZES = {
  sm: "px-4 py-1.5 text-sm",
  default: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-[17px]",
} as const;

// The outline pill gives a pixel of padding back to its border on each axis,
// so its box matches the filled pill's at the same size.
const OUTLINE_SIZES = {
  sm: "px-[15px] py-[5px] text-sm",
  default: "px-[23px] py-[11px] text-base",
  lg: "px-[31px] py-[15px] text-[17px]",
} as const;

type PrismButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  /** Open href in a new tab. */
  external?: boolean;
  /** Navigate with a full page load instead of client-side routing. */
  reload?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  type?: "button" | "submit";
  /** Stretch to the container's width — for card CTAs. Default is intrinsic. */
  fullWidth?: boolean;
  size?: keyof typeof SIZES;
};

// The brand's primary CTA (see prisma.io's PrismButton): a black pill with a
// living spectrum glow at rest and a prismatic fill on hover. Styles live in
// globals.css under .prism-cta.
export function PrismButton({
  children,
  className = "",
  href,
  external = false,
  reload = false,
  onClick,
  disabled,
  type = "button",
  fullWidth = false,
  size = "default",
}: PrismButtonProps) {
  const Anchor = reload || external ? "a" : Link;
  const buttonClass = `prism-cta-button ${SIZES[size]}`;
  const inner = (
    <>
      <span aria-hidden className="prism-cta-fill" />
      <span className="prism-cta-label">{children}</span>
    </>
  );

  return (
    <span className={`prism-cta ${fullWidth ? "w-full" : ""} ${className}`}>
      <span aria-hidden className="prism-cta-glow">
        <span style={{ backgroundImage: SPECTRUM }} />
      </span>
      <span aria-hidden className="prism-cta-bloom" style={{ backgroundImage: SPECTRUM }} />
      {href ? (
        <Anchor
          href={href}
          onClick={onClick}
          className={buttonClass}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {inner}
        </Anchor>
      ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={buttonClass}>
          {inner}
        </button>
      )}
    </span>
  );
}

// Secondary pill: thin neutral border that reveals the moving spectrum on
// hover.
export function PrismButtonOutline({
  children,
  className = "",
  href,
  external = false,
  onClick,
  disabled,
  type = "button",
  fullWidth = false,
  size = "default",
}: PrismButtonProps) {
  const cls = `spectrum-border inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#646567] font-semibold leading-[1.5] text-foreground transition-colors duration-500 hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
    OUTLINE_SIZES[size]
  } ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

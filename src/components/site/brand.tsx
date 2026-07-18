import fs from "node:fs";
import path from "node:path";

/**
 * The SlopHunt wordmark. Renders public/text-logo.png when it exists and falls
 * back to the typographic mark until then — drop the file in and every
 * placement upgrades on the next request, no code change.
 *
 * Server-only (fs check); nav and footer are both RSC so that's free.
 */

const LOGO_FILE = path.join(process.cwd(), "public", "text-logo.png");

export function hasLogoFile(): boolean {
  try {
    return fs.existsSync(LOGO_FILE);
  } catch {
    return false;
  }
}

export function Brand({ size = "nav" }: { size?: "nav" | "footer" }) {
  const imgClass = size === "footer" ? "h-10 w-auto" : "h-8 w-auto";
  const textClass =
    size === "footer"
      ? "font-display text-2xl font-black uppercase"
      : "font-display text-xl font-black uppercase tracking-tight";
  const squareClass = "inline-block h-5 w-5 border-2 border-toxic bg-toxic";

  if (hasLogoFile()) {
    return (
      // Dimensions depend on whatever file the user drops in, so next/image's
      // static sizing doesn't apply — height is clamped by CSS instead.
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/text-logo.png" alt="SlopHunt" className={imgClass} />
    );
  }

  return (
    <span className={`flex items-center gap-2 ${textClass}`}>
      <span aria-hidden className={squareClass} />
      SlopHunt
    </span>
  );
}

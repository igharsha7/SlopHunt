import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
      <span className="font-display font-black uppercase text-mega text-toxic">
        404
      </span>
      <h1 className="mt-4 font-display text-big font-black uppercase">
        This already doesn&apos;t exist
      </h1>
      <p className="mt-3 text-ash">
        Fitting, for a site about things that shouldn&apos;t. The page you wanted
        is gone, abandoned, or never shipped.
      </p>
      <Link
        href="/"
        className="press mt-8 border-2 border-toxic bg-toxic px-6 py-3 font-display text-sm font-black uppercase tracking-widest text-void"
      >
        Back to the slop
      </Link>
    </div>
  );
}

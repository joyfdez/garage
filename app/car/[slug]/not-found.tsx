import Link from "next/link";

export default function CarNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="font-display font-bold text-2xl mb-2">Car not found</p>
      <p className="text-ink/40 text-sm mb-6">This car doesn't exist or is private.</p>
      <Link
        href="/profile"
        className="text-sm text-green-bright hover:underline"
      >
        Back to garage
      </Link>
    </div>
  );
}

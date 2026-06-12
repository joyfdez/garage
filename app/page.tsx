import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-ink leading-tight">
          The home for people<br />who build cars.
        </h1>
        <p className="text-ink/60 text-lg max-w-sm">
          Add your car. Track its life. Share the journey.
        </p>
        <Link
          href="/garage/new"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-orange px-8 py-3.5 text-white font-semibold text-base hover:bg-orange-600 transition-colors"
        >
          Add your first car
        </Link>
      </div>
      <footer className="py-6 text-center text-ink/30 text-xs">
        Track the life of every car.
      </footer>
    </div>
  );
}

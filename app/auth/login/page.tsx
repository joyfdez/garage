import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign in — Garage",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 bg-paper">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand mark */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold leading-tight">
            The home for people<br />who build cars.
          </h1>
          <p className="text-ink/40 text-sm mt-2">Track the life of every car.</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-card bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <AuthForm errorParam={error} />
        </div>
      </div>
    </div>
  );
}

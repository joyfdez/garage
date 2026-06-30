import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CatalogBreadcrumb } from "@/components/CatalogBreadcrumb";
import { GenerationTagButtons } from "@/components/GenerationTagButtons";

// ── Types ─────────────────────────────────────────────────────────────────────

type MakeRow = { name: string; slug: string; logo_path: string | null };
type ModelRow = { name: string; slug: string; make: MakeRow | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

function anonSupabase() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function yearLabel(start: number, end: number | null): string {
  return end ? `${start}–${end}` : `${start}–`;
}

function CarSilhouette() {
  return (
    <svg
      width="40"
      height="18"
      viewBox="0 0 40 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 12 H6 V10 L10 5 H30 L34 10 V12 H39"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="13" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="31" cy="13" r="3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const anon = anonSupabase();

  const { data: gen } = await anon
    .from("car_models")
    .select("generation, model:models(name, make:makes(name))")
    .eq("slug", slug)
    .single();

  if (!gen) return { title: "Generation not found — Garage" };

  const model = gen.model as unknown as { name: string; make: { name: string } | null } | null;
  const makeName = model?.make?.name ?? "";
  const title = `${makeName} ${model?.name ?? ""} ${gen.generation}`;

  return {
    title: `${title} — Garage`,
    description: `${title} — specs, history, and community cars on Garage.`,
    openGraph: { title: `${title} — Garage` },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anon = anonSupabase();

  // ── 1. Generation ─────────────────────────────────────────────────────────
  const { data: gen } = await anon
    .from("car_models")
    .select(
      "id, generation, chassis_code, year_start, year_end, engines, slug, description, cover_photo_path, model_ref_id"
    )
    .eq("slug", slug)
    .single();

  if (!gen) notFound();

  // ── 2. Parent model + make ────────────────────────────────────────────────
  const { data: rawModel } = await anon
    .from("models")
    .select("name, slug, make:makes(name, slug, logo_path)")
    .eq("id", gen.model_ref_id)
    .single();

  if (!rawModel) notFound();

  const model = rawModel as unknown as ModelRow;
  const make = model.make;

  // ── 3. Parallel: user tags, photos, community cars, count ─────────────────
  const [
    { data: tagRows },
    { data: photoRows },
    { data: publicCars },
    { data: allCars },
  ] = await Promise.all([
    user
      ? supabase
          .from("user_model_tags")
          .select("model_id, tag_type")
          .eq("user_id", user.id)
          .eq("model_id", gen.id)
      : { data: [] as { model_id: string; tag_type: string }[] },

    anon
      .from("model_photos")
      .select("storage_path, position")
      .eq("car_model_id", gen.id)
      .order("position"),

    supabase
      .from("cars")
      .select(
        "slug, year, nickname, cover_photo_path, owner:profiles!current_owner_id(username, display_name)"
      )
      .eq("model_id", gen.id)
      .eq("visibility", "public")
      .order("year", { ascending: true })
      .limit(40),

    supabase.from("cars").select("id").eq("model_id", gen.id),
  ]);

  const initialTagKeys = (tagRows ?? []).map(
    (t) => `${t.model_id}:${t.tag_type}`
  );
  const photos = photoRows ?? [];
  const totalCount = (allCars ?? []).length;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const catalogBase = `${supabaseUrl}/storage/v1/object/public/catalog`;
  const carPhotosBase = `${supabaseUrl}/storage/v1/object/public/car-photos`;

  const makeLogoUrl = make?.logo_path
    ? `${catalogBase}/${make.logo_path}`
    : null;

  const showChassis =
    gen.chassis_code && gen.chassis_code !== gen.generation;

  const description = (gen as { description?: string | null }).description;
  const coverPath = (gen as { cover_photo_path?: string | null }).cover_photo_path;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header — centered ────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe-page-8 pb-7 border-b border-ink/8 text-center">
        {/* Generation name */}
        <h1 className="font-display font-extrabold text-[2.75rem] leading-none tracking-tight text-ink">
          {gen.generation}
        </h1>

        {/* Breadcrumb: model → make */}
        <CatalogBreadcrumb
          items={[
            { label: model.name, href: `/model/${model.slug}` },
            ...(make
              ? [{ label: make.name, href: `/make/${make.slug}`, logoUrl: makeLogoUrl }]
              : []),
          ]}
        />

        {/* Chassis code + year span */}
        <p className="text-[0.52rem] uppercase tracking-[0.18em] text-hint mt-4 leading-none">
          {[
            showChassis ? gen.chassis_code : null,
            yearLabel(gen.year_start, gen.year_end),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Community car count */}
        {totalCount > 0 && (
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted mt-2 leading-none">
            {totalCount} {totalCount === 1 ? "car" : "cars"} in the community
          </p>
        )}

        {/* Tag buttons — centered in header, only when logged in */}
        {user && (
          <div className="mt-5">
            <GenerationTagButtons
              genId={gen.id}
              initialTagKeys={initialTagKeys}
            />
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-7 space-y-7">
        {/* Engine chips */}
        {(gen.engines as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(gen.engines as string[]).map((engine: string) => (
              <span
                key={engine}
                className="text-[0.58rem] uppercase tracking-[0.06em] text-ink-muted bg-ink/[0.06] px-2 py-1 rounded-full leading-none"
              >
                {engine}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
        )}

        {/* Cover photo hero or color fallback */}
        <div className="aspect-video rounded-xl overflow-hidden">
          {coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${catalogBase}/${coverPath}`}
              alt={gen.generation}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-racing-green flex flex-col justify-end p-5">
              <p className="font-display font-extrabold text-white/90 text-2xl leading-none">
                {gen.generation}
              </p>
              {make && (
                <p className="text-white/50 text-[0.6rem] uppercase tracking-wider mt-1">
                  {make.name} · {model.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Gallery */}
        {photos.length > 0 ? (
          <div>
            <p className="text-[0.52rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
              Gallery
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {photos.map((photo) => (
                <div
                  key={photo.storage_path}
                  className="shrink-0 w-[140px] aspect-[4/3] rounded-xl overflow-hidden bg-ink/[0.05]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${catalogBase}/${photo.storage_path}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-hint">
            <CarSilhouette />
            <span className="text-[0.55rem] uppercase tracking-[0.18em]">
              Photos coming soon
            </span>
          </div>
        )}

        {/* Community cars */}
        {(publicCars ?? []).length > 0 && (
          <div>
            <p className="text-[0.52rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
              {totalCount} {totalCount === 1 ? "car" : "cars"} in Garage
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(publicCars as unknown as {
                slug: string;
                year: number;
                nickname: string | null;
                cover_photo_path: string | null;
                owner: { username: string; display_name: string | null } | null;
              }[]).map((car) => {
                const photoUrl = car.cover_photo_path
                  ? `${carPhotosBase}/${car.cover_photo_path}`
                  : null;
                return (
                  <Link
                    key={car.slug}
                    href={`/car/${car.slug}`}
                    className="block shrink-0 w-[120px] group"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-racing-green mb-2 relative">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={`${car.year} ${make?.name ?? ""} ${model.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-end p-2">
                          <p className="font-display font-bold text-white/80 text-xs leading-tight">
                            {car.year}
                            <br />
                            <span className="text-white/40 text-[0.6rem]">
                              {model.name}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-[0.65rem] font-semibold text-ink leading-tight truncate">
                      {car.year}
                      {car.nickname && (
                        <span className="text-ink/60 font-normal ml-1">
                          {car.nickname}
                        </span>
                      )}
                    </p>
                    {car.owner?.username && (
                      <p className="text-[0.58rem] text-ink-muted truncate mt-0.5">
                        @{car.owner.username}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

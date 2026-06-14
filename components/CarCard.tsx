import Link from "next/link";
import { Lock } from "lucide-react";

interface CarCardProps {
  slug: string;
  year: number;
  make: string;
  model: string;
  generation: string;
  nickname: string | null;
  coverPhotoPath: string | null;
  isPrivate: boolean;
  eventCount: number;
  supabaseUrl: string;
  previouslyOwned?: boolean;
  ownershipPeriod?: string | null;
}

export function CarCard({
  slug,
  year,
  make,
  model,
  generation,
  nickname,
  coverPhotoPath,
  isPrivate,
  eventCount,
  supabaseUrl,
  previouslyOwned = false,
  ownershipPeriod,
}: CarCardProps) {
  const coverUrl = coverPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${coverPhotoPath}`
    : null;

  return (
    <Link href={`/car/${slug}`} className="block group">
      <div className={`bg-card rounded-2xl overflow-hidden ${previouslyOwned ? "opacity-70" : ""}`}>
        {/* Cover photo */}
        <div className="aspect-[4/3] bg-card relative overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={`${year} ${make} ${model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-racing-green flex flex-col justify-end p-3">
              <p className="text-[0.5rem] uppercase tracking-[0.18em] font-bold text-white/50 leading-none mb-1">
                {make}
              </p>
              <p className="font-display font-extrabold text-white text-sm leading-tight">
                {model}
                {generation && (
                  <span className="text-white/55 font-semibold ml-1">{generation}</span>
                )}
              </p>
              <p className="text-white/30 text-[0.58rem] mt-1">{year}</p>
            </div>
          )}
          {isPrivate && (
            <div className="absolute top-2 right-2 bg-paper/90 backdrop-blur-sm rounded-full p-1">
              <Lock size={10} className="text-ink-muted" />
            </div>
          )}
          {previouslyOwned && (
            <div className="absolute bottom-0 inset-x-0 bg-ink/60 backdrop-blur-sm text-white text-[10px] font-medium text-center py-1 tracking-wide">
              No longer owned
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-display font-bold text-sm leading-tight">
            {year} {make} {model}
            {generation && <span className="text-ink/40 font-normal ml-1">{generation}</span>}
          </p>
          {nickname && (
            <p className="text-ink/50 text-xs mt-0.5 truncate">{nickname}</p>
          )}
          {ownershipPeriod && (
            <p className="text-ink/30 text-xs mt-0.5">{ownershipPeriod}</p>
          )}
          {eventCount > 0 && (
            <p className="text-ink/30 text-xs mt-1">
              {eventCount} {eventCount === 1 ? "entry" : "entries"}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { Lock, Wrench } from "lucide-react";

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
            <div className="w-full h-full flex items-center justify-center">
              <Wrench size={32} className="text-ink/10" />
            </div>
          )}
          {isPrivate && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
              <Lock size={11} className="text-white" />
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

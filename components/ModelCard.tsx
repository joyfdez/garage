import { CarModel, yearLabel } from "@/components/BrowsePicker";
import { TagType } from "@/lib/actions/modelTags";

interface ModelCardProps {
  model: CarModel;
  tagSet: Set<string>;
  pending: string | null;
  onToggle: (id: string, type: TagType) => void;
}

export function ModelCard({ model, tagSet, pending, onToggle }: ModelCardProps) {
  const isDriven   = tagSet.has(`${model.id}:driven`);
  const isWishlist = tagSet.has(`${model.id}:wishlist`);

  const metaParts = [
    model.chassis_code && model.chassis_code !== model.generation
      ? model.chassis_code
      : null,
    yearLabel(model),
  ].filter(Boolean);

  return (
    <div
      className={`bg-white rounded-card border overflow-hidden transition-colors ${
        isDriven || isWishlist ? "border-ink/15" : "border-ink/8"
      }`}
    >
      {/* Top accent bar */}
      <div
        className={`h-[3px] ${
          isDriven
            ? "bg-racing-green"
            : isWishlist
            ? "bg-green-bright/60"
            : "bg-racing-green/12"
        }`}
      />

      <div className="p-3.5 flex flex-col gap-2.5">
        {/* Make + model name */}
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.2em] font-bold text-hint mb-0.5 leading-none">
            {model.make}
          </p>
          <h3
            className={`font-display font-bold text-base leading-tight ${
              isDriven ? "text-racing-green" : "text-ink"
            }`}
          >
            {model.model}
            {model.generation && (
              <span
                className={
                  isDriven ? "text-racing-green/60" : "text-ink/45"
                }
              >
                {" "}
                {model.generation}
              </span>
            )}
          </h3>
        </div>

        {/* Chassis code + year range */}
        {metaParts.length > 0 && (
          <p className="text-[0.52rem] uppercase tracking-[0.14em] text-hint leading-none">
            {metaParts.join(" · ")}
          </p>
        )}

        {/* Tag buttons */}
        <div className="flex gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onToggle(model.id, "driven")}
            disabled={!!pending}
            className={`flex-1 text-[0.65rem] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isDriven
                ? "bg-racing-green text-white"
                : "border border-ink/10 text-hint hover:border-racing-green/35 hover:text-racing-green"
            }`}
          >
            Driven
          </button>
          <button
            type="button"
            onClick={() => onToggle(model.id, "wishlist")}
            disabled={!!pending}
            className={`flex-1 text-[0.65rem] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isWishlist
                ? "bg-green-bright text-white"
                : "border border-ink/10 text-hint hover:border-green-bright/40 hover:text-green-bright"
            }`}
          >
            Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

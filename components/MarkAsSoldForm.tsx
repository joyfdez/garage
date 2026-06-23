"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markAsSold, CarState } from "@/lib/actions/car";
import { DollarSign, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";

export function MarkAsSoldForm({
  carId,
  carName,
  purchaseCurrency,
  preferredUnit = "km",
  preferredCurrency = "EUR",
}: {
  carId: string;
  carName: string;
  purchaseCurrency: string;
  preferredUnit?: "km" | "mi";
  preferredCurrency?: string;
}) {
  const [state, action, pending] = useActionState<CarState, FormData>(markAsSold, null);
  const [pricePublic, setPricePublic] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [saleMileageUnit, setSaleMileageUnit] = useState<"km" | "mi">(preferredUnit);
  const router = useRouter();
  const lockedCurrency = purchaseCurrency || preferredCurrency || "EUR";

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!state) return;
    if ("slug" in state) {
      setNavigating(true);
      toast.success("Marked as sold");
      router.push(`/car/${state.slug}`);
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="car_id" value={carId} />
      <input type="hidden" name="sale_price_public" value={String(pricePublic)} />

      <div>
        <label className="text-xs text-ink/50 mb-1 block">Sale date *</label>
        <input
          name="sale_date"
          type="date"
          required
          defaultValue={today}
          max={today}
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="text-xs text-ink/50 mb-1 block">
          Odometer at sale <span className="text-ink/30">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            name="sale_mileage_value"
            type="number"
            min={1}
            max={9999999}
            placeholder="120000"
            className="input-field flex-1"
          />
          <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
            {(["km", "mi"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setSaleMileageUnit(u)}
                className={`px-3 py-3 transition-colors ${
                  saleMileageUnit === u
                    ? "bg-ink text-paper"
                    : "bg-card text-ink/50 hover:bg-ink/10"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input type="hidden" name="sale_mileage_unit" value={saleMileageUnit} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-ink/50 block">Sale price (optional)</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
            <input
              name="sale_price"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              className="input-field w-full pl-8"
            />
          </div>
          <div className="input-field w-24 flex items-center justify-center text-ink/50 text-sm select-none">
            {lockedCurrency}
          </div>
          <input type="hidden" name="currency" value={lockedCurrency} />
        </div>

        <button
          type="button"
          onClick={() => setPricePublic((v) => !v)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            pricePublic ? "text-racing-green" : "text-ink/40 hover:text-ink/60"
          }`}
        >
          {pricePublic ? <Eye size={12} /> : <EyeOff size={12} />}
          {pricePublic ? "Price visible on public car page" : "Price is private (only you see it)"}
        </button>
      </div>

      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || navigating}
        className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/80 transition-colors disabled:opacity-50"
      >
        {pending || navigating ? "Saving…" : `Mark ${carName} as sold`}
      </button>
    </form>
  );
}

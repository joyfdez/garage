"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { updateSaleDetails, CarState } from "@/lib/actions/car";
import { CURRENCIES } from "@/lib/car-options";

function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
function formatInt(raw: string) {
  const n = parseInt(raw, 10);
  return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
}

export function EditSaleForm({
  carId,
  carName,
  saleDate: initialSaleDate,
  salePrice: initialSalePrice,
  salePricePublic: initialSalePricePublic,
  currency: initialCurrency,
  saleMileageValue: initialSaleMileageValue,
  saleMileageUnit: initialSaleMileageUnit,
  preferredUnit = "km",
}: {
  carId: string;
  carName: string;
  saleDate: string | null;
  salePrice: number | null;
  salePricePublic: boolean;
  currency: string;
  saleMileageValue: number | null;
  saleMileageUnit: string | null;
  preferredUnit?: "km" | "mi";
}) {
  const [state, action, pending] = useActionState<CarState, FormData>(updateSaleDetails, null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [pricePublic, setPricePublic] = useState(initialSalePricePublic);
  const [currency, setCurrency] = useState(initialCurrency || "EUR");
  const [rawPrice, setRawPrice] = useState(
    initialSalePrice != null ? String(Math.round(initialSalePrice)) : ""
  );
  const [rawMileage, setRawMileage] = useState(
    initialSaleMileageValue != null ? String(initialSaleMileageValue) : ""
  );
  const [saleMileageUnit, setSaleMileageUnit] = useState<"km" | "mi">(
    (initialSaleMileageUnit as "km" | "mi") ?? preferredUnit
  );
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;

  useEffect(() => {
    if (state && "slug" in state) {
      setNavigating(true);
      toast.success("Sale details updated", { style: { borderLeft: "3px solid #1A3A2E" } });
      router.push(`/car/${state.slug}`);
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
          defaultValue={initialSaleDate ?? ""}
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="text-xs text-ink/50 mb-1 block">Odometer at sale</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatInt(rawMileage)}
            onChange={(e) => setRawMileage(parseDigits(e.target.value))}
            placeholder="120,000"
            className="input-field flex-1"
          />
          <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
            {(["km", "mi"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setSaleMileageUnit(u)}
                className={`px-3 py-3 transition-colors ${
                  saleMileageUnit === u ? "bg-ink text-paper" : "bg-card text-ink/50 hover:bg-ink/10"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input type="hidden" name="sale_mileage_value" value={rawMileage} />
        <input type="hidden" name="sale_mileage_unit" value={saleMileageUnit} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-ink/50 block">Sale price</label>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field appearance-none pr-7 pl-3"
            >
              {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 pointer-events-none select-none">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatInt(rawPrice)}
              onChange={(e) => setRawPrice(parseDigits(e.target.value))}
              placeholder="0"
              className="input-field w-full pl-9"
            />
          </div>
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="sale_price" value={rawPrice} />
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
        {pending || navigating ? "Saving…" : `Save sale details`}
      </button>
    </form>
  );
}

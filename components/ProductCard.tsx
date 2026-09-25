'use client';

type Product = {
  id: string;
  name: string;
  subtitle: string | null;
  price: number;
  daily_profit: number;
  duration_days: number;
  image_url: string | null;
  tag: string | null;
};

export default function ProductCard({
  product,
  onRent,
}: {
  product: Product;
  onRent: (product: Product) => void;
}) {
  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Hero image container */}
      <div className="relative bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] aspect-square">
        {/* Days tag */}
        <span className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
          {product.duration_days} days
        </span>

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🚗
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
          <p className="text-[11px] text-[#8A8A8A] mt-0.5">
            {product.subtitle ?? 'Everyday electric performance'}
          </p>
        </div>

        {/* 3 feature chips */}
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          <div className="bg-[#0F0F0F] rounded-xl py-1.5 text-center">
            <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider">
              Daily
            </div>
            <div className="text-[11px] font-semibold text-emerald-400">
              +{Math.round(product.daily_profit / 1000)}k
            </div>
          </div>
          <div className="bg-[#0F0F0F] rounded-xl py-1.5 text-center">
            <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider">
              Total
            </div>
            <div className="text-[11px] font-semibold text-white">
              {Math.round((product.daily_profit * product.duration_days) / 1000)}k
            </div>
          </div>
          <div className="bg-[#0F0F0F] rounded-xl py-1.5 text-center">
            <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider">
              Range
            </div>
            <div className="text-[11px] font-semibold text-white">—</div>
          </div>
        </div>

        {/* Price */}
        <div className="text-xs text-[#8A8A8A] mt-1">
          UGX <span className="text-white font-bold text-sm">{product.price.toLocaleString()}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onRent(product)}
          className="mt-auto bg-[#E31937] text-white font-semibold text-sm py-2.5 rounded-2xl active:scale-[0.98] transition"
        >
          Rent Now
        </button>
      </div>
    </div>
  );
}

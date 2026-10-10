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
  const total = product.daily_profit * product.duration_days;

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Hero image container */}
      <div className="relative bg-gradient-to-b from-[#1A1A1F] to-[#0F0F12] aspect-square">
        {/* Days tag */}
        <span className="absolute top-3 left-3 z-10 bg-[#C8833A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          {product.duration_days} days
        </span>

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            ✈️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-sm leading-tight text-[#F5F2ED]">
          {product.name}
        </h3>

        {/* 2 feature chips */}
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <div className="bg-[#15151A] rounded-xl py-2 text-center border border-[#2A2823]">
            <div className="text-[9px] text-[#8A8580] uppercase tracking-wider">
              Daily
            </div>
            <div className="text-[11px] font-bold text-[#E0A44C]">
              {product.daily_profit.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#15151A] rounded-xl py-2 text-center border border-[#2A2823]">
            <div className="text-[9px] text-[#8A8580] uppercase tracking-wider">
              Total
            </div>
            <div className="text-[11px] font-bold text-[#F5F2ED]">
              {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-xs text-[#8A8580] mt-1">
          UGX{' '}
          <span className="text-[#F5F2ED] font-bold text-sm">
            {product.price.toLocaleString()}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onRent(product)}
          className="mt-auto bg-[#C8833A] text-white font-semibold text-sm py-2.5 rounded-2xl active:scale-[0.98] transition"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
}

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
      <div className="relative bg-gradient-to-b from-[#F7F8F5] to-[#E3E8DE] aspect-square">
        {/* Days tag */}
        <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur text-[#1F2A1B] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#E3E8DE]">
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
          <h3 className="font-bold text-sm leading-tight text-[#1F2A1B]">
            {product.name}
          </h3>
          <p className="text-[11px] text-[#6B7A62] mt-0.5">
            {product.subtitle ?? 'Everyday electric performance'}
          </p>
        </div>

        {/* 2 feature chips */}
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <div className="bg-[#F7F8F5] rounded-xl py-2 text-center border border-[#E3E8DE]">
            <div className="text-[9px] text-[#6B7A62] uppercase tracking-wider">
              Daily
            </div>
            <div className="text-[11px] font-bold text-[#7C9070]">
              {product.daily_profit.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#F7F8F5] rounded-xl py-2 text-center border border-[#E3E8DE]">
            <div className="text-[9px] text-[#6B7A62] uppercase tracking-wider">
              Total
            </div>
            <div className="text-[11px] font-bold text-[#1F2A1B]">
              {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-xs text-[#6B7A62] mt-1">
          UGX{' '}
          <span className="text-[#1F2A1B] font-bold text-sm">
            {product.price.toLocaleString()}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onRent(product)}
          className="mt-auto bg-[#7C9070] text-white font-semibold text-sm py-2.5 rounded-2xl active:scale-[0.98] transition"
        >
          Rent Now
        </button>
      </div>
    </div>
  );
}

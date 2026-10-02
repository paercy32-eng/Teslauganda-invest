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
      <div className="relative bg-gradient-to-b from-[#F5F7FA] to-[#E1E7EF] aspect-square">
        {/* Days tag */}
        <span className="absolute top-3 left-3 z-10 bg-[#0A2540] text-[#00D9FF] text-[10px] font-bold px-2.5 py-1 rounded-full">
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
            🤖
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-sm leading-tight text-[#0A2540]">
          {product.name}
        </h3>

        {/* 2 feature chips */}
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <div className="bg-[#F5F7FA] rounded-xl py-2 text-center border border-[#E1E7EF]">
            <div className="text-[9px] text-[#6B7A8F] uppercase tracking-wider">
              Daily
            </div>
            <div className="text-[11px] font-bold text-[#00B8DB]">
              {product.daily_profit.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#F5F7FA] rounded-xl py-2 text-center border border-[#E1E7EF]">
            <div className="text-[9px] text-[#6B7A8F] uppercase tracking-wider">
              Total
            </div>
            <div className="text-[11px] font-bold text-[#0A2540]">
              {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-xs text-[#6B7A8F] mt-1">
          UGX{' '}
          <span className="text-[#0A2540] font-bold text-sm">
            {product.price.toLocaleString()}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onRent(product)}
          className="mt-auto bg-[#0A2540] text-white font-semibold text-sm py-2.5 rounded-2xl active:scale-[0.98] transition"
        >
          Rent Now
        </button>
      </div>
    </div>
  );
}

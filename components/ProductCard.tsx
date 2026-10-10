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
  onRent: (p: Product) => void;
}) {
  const totalReturn = Number(product.daily_profit) * product.duration_days;

  return (
    <div className="card p-3 flex gap-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.99] transition">
      {/* Image Section */}
      <div className="relative w-28 h-28 flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl border border-[#2A2823]"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-[#15151A] border border-[#2A2823] flex items-center justify-center text-2xl">
            🤖
          </div>
        )}
        {/* Days Badge */}
        <div className="absolute top-1.5 left-1.5 bg-[#C8833A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          {product.duration_days} days
        </div>
      </div>

      {/* Details Section */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-bold text-[#F5F2ED] text-sm leading-tight mb-1">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="text-[10px] text-[#8A8580] leading-tight mb-2">
              {product.subtitle}
            </p>
          )}
        </div>

        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="bg-[#15151A] border border-[#2A2823] rounded-lg px-2 py-1.5 text-center">
              <div className="text-[8px] text-[#8A8580] font-bold tracking-wider">DAILY</div>
              <div className="text-[10px] font-bold text-[#E0A44C]">
                {Number(product.daily_profit).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#15151A] border border-[#2A2823] rounded-lg px-2 py-1.5 text-center">
              <div className="text-[8px] text-[#8A8580] font-bold tracking-wider">TOTAL</div>
              <div className="text-[10px] font-bold text-[#F5F2ED]">
                {totalReturn.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Price and Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#F5F2ED]">
              UGX {Number(product.price).toLocaleString()}
            </div>
            <button
              onClick={() => onRent(product)}
              className="bg-[#C8833A] text-white text-[10px] font-bold px-4 py-2 rounded-xl active:scale-95 transition"
            >
              Invest Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative group bg-[#1A1A1F] border border-[#2A2A30] rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:border-[#C8833A]/50 shadow-lg">
      
      {/* Subtle background glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C8833A] rounded-full mix-blend-screen filter blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

      <div className="flex gap-4 relative z-10">
        
        {/* Left Side: Details */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-bold text-[#F5F2ED] text-base leading-tight mb-1">
              {product.name}
            </h3>
            {/* Subtitle removed */}
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-4 mb-2">
              <div>
                <div className="text-[9px] text-[#8A8580] font-bold tracking-wider">DAILY</div>
                <div className="text-[11px] font-bold text-[#E0A44C]">
                  {Number(product.daily_profit).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#8A8580] font-bold tracking-wider">TOTAL</div>
                <div className="text-[11px] font-bold text-[#F5F2ED]">
                  {totalReturn.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-lg font-bold text-[#F5F2ED] mt-2">
              UGX {Number(product.price).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="relative w-28 h-28 flex-shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl border border-[#2A2A30] shadow-md"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-[#15151A] border border-[#2A2A30] flex items-center justify-center text-2xl">
              🤖
            </div>
          )}
          {/* Days Badge */}
          <div className="absolute -top-2 -right-2 bg-[#C8833A] text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg">
            {product.duration_days} days
          </div>
        </div>
      </div>

      {/* Full width Invest Button at the bottom */}
      <div className="mt-4 pt-3 border-t border-[#2A2A30] relative z-10">
        <button
          onClick={() => onRent(product)}
          className="w-full bg-gradient-to-r from-[#C8833A] to-[#E0A44C] text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#C8833A]/20"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
}

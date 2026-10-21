'use client';

type Product = {
  id: string;
  name: string;
  price: number;
  cycle_days: number;
  daily_return: number;
};

export default function ProductCard({
  product,
  onRent,
}: {
  product: Product;
  onRent: (p: Product) => void;
}) {
  const totalReturn = Number(product.daily_return) * product.cycle_days;

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 flex gap-4 transition active:scale-[0.98]">
      {/* Icon Placeholder */}
      <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-[#111827] border border-[#374151] flex items-center justify-center relative overflow-hidden">
        <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-bold text-white text-sm leading-tight mb-1">
            {product.name}
          </h3>
          <div className="text-[10px] font-bold text-[#EA580C]">
            {product.cycle_days} Days Cycle
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-1.5 mb-3 mt-2">
            <div className="bg-[#111827] rounded-lg px-2 py-1.5 text-center border border-[#374151]">
              <div className="text-[8px] text-gray-400 font-bold uppercase">Daily</div>
              <div className="text-[10px] font-bold text-white">
                {Number(product.daily_return).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#111827] rounded-lg px-2 py-1.5 text-center border border-[#374151]">
              <div className="text-[8px] text-gray-400 font-bold uppercase">Total</div>
              <div className="text-[10px] font-bold text-white">
                {totalReturn.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white">
              UGX {Number(product.price).toLocaleString()}
            </div>
            <button
              onClick={() => onRent(product)}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white text-[10px] font-bold px-4 py-2 rounded-lg active:scale-95 transition"
            >
              Invest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

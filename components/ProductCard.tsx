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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex shadow-sm transition active:scale-[0.98]">
      
      {/* Image Section (55% width) */}
      <div className="w-[55%] h-36 relative bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 opacity-50">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        </div>
        
        {/* Cycle Badge overlaid on image */}
        <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
          {product.cycle_days} Days
        </div>
      </div>

      {/* Details Section (45% width) */}
      <div className="w-[45%] p-3 flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
            {product.name}
          </h3>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-500 font-medium">Daily</span>
              <span className="font-bold text-green-600">
                {Number(product.daily_return).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="font-bold text-gray-900">
                {totalReturn.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-xs font-extrabold text-gray-900 mb-2">
            UGX {Number(product.price).toLocaleString()}
          </div>
          <button
            onClick={() => onRent(product)}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-2 rounded-lg active:scale-95 transition"
          >
            Invest Now
          </button>
        </div>
      </div>
    </div>
  );
}

import { Anchor } from 'lucide-react';

export default function FooterWave() {
  return (
    <div className="mt-20">
      {/* Decorative wave */}
      <div className="relative">
        <svg
          className="block w-full h-24 md:h-32 text-blue-50"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,224L40,192C80,160,160,96,240,96C320,96,400,160,480,176C560,192,640,160,720,138.7C800,117,880,107,960,128C1040,149,1120,203,1200,202.7C1280,203,1360,149,1400,122.7L1440,96L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
          />
        </svg>
        {/* subtle top gradient to blend content into wave */}
        <div className="absolute -top-8 inset-x-0 h-8 bg-gradient-to-b from-transparent to-blue-50 pointer-events-none" />
      </div>

      {/* Footer content */}
      <footer className="py-10 px-6 bg-blue-50">
        <div className="max-w-7xl mx-auto text-center text-slate-700">
          <div className="flex items-center justify-center gap-2 text-blue-900 font-bold text-lg mb-2">
            <Anchor className="w-5 h-5" /> Coastal Fishers
          </div>
          <p>© 2025 Coastal Fishers • VeChain Testnet • Sustainably Caught in Coastal Waters</p>
          <p className="text-sm mt-1">Ocean-Fresh Quality for a better you.</p>
        </div>
      </footer>
    </div>
  );
}

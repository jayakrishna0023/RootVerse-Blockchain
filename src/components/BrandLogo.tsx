import { Fish, Link as LinkIcon } from 'lucide-react';

type BrandLogoProps = {
  className?: string
  variant?: 'light' | 'dark'
}

export default function BrandLogo({ className = '', variant = 'dark' }: BrandLogoProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className={`absolute inset-0 rounded-xl rotate-3 ${isDark ? 'bg-ocean-600' : 'bg-white'} shadow-lg`} />
        <div className={`absolute inset-0 rounded-xl -rotate-3 ${isDark ? 'bg-ocean-800' : 'bg-ocean-100'} opacity-50`} />
        <div className="relative z-10 flex items-center justify-center">
          <Fish className={`w-6 h-6 ${isDark ? 'text-white' : 'text-ocean-600'}`} strokeWidth={2.5} />
          <LinkIcon className={`w-3 h-3 absolute -bottom-1 -right-1 ${isDark ? 'text-coral-500' : 'text-coral-600'}`} strokeWidth={3} />
        </div>
      </div>
      
      <div className="flex flex-col">
        <span className={`text-xl font-black tracking-tight leading-none ${isDark ? 'text-slate-900' : 'text-white'}`}>
          ROOT<span className="text-ocean-500">VERSE</span>
        </span>
        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isDark ? 'text-slate-500' : 'text-ocean-100'}`}>
          BLOCKCHAIN SEAFOOD
        </span>
      </div>
    </div>
  )
}

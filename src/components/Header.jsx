import { ChevronLeft } from 'lucide-react';

export const Header = ({ title, subtitle, rightAction, onBack }) => (
  <div className="pt-12 pb-6 px-6 bg-zinc-950 sticky top-0 z-40 border-b border-zinc-900/50">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack} 
            className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#d4ff00] hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          {subtitle && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#d4ff00] uppercase tracking-widest">{subtitle}</span>
            </div>
          )}
          <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-100">{title}</h1>
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  </div>
);

export default Header;

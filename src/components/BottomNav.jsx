import { Home, Users, Ticket, Box } from 'lucide-react';
import { THEME } from '../constants/theme';

export const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-2 transition-colors relative ${active ? THEME.accentText : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    {active && <div className="w-6 h-0.5 bg-[#d4ff00] rounded-full absolute bottom-0"></div>}
  </button>
);

export const BottomNav = ({ activeTab, onNavigate }) => {
  return (
    <nav className="fixed md:absolute bottom-0 w-full max-w-md mx-auto bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20">
      <NavButton icon={Home} label="Home" active={activeTab === 'home'} onClick={() => onNavigate('home')} />
      <NavButton icon={Users} label="Members" active={activeTab === 'members'} onClick={() => onNavigate('members')} />
      <NavButton icon={Ticket} label="Day Pass" active={activeTab === 'daypass'} onClick={() => onNavigate('daypass')} />
      <NavButton icon={Box} label="Stocks" active={activeTab === 'stocks'} onClick={() => onNavigate('stocks')} />
    </nav>
  );
};

export default BottomNav;

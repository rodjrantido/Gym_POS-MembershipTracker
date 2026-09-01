import { Trash2 } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import PurchaseHistoryList from '../../components/PurchaseHistoryList';

export const DayPasserDetailScreen = ({ passer, navigate, onDelete, onMarkPaid }) => {
  if (!passer) return null;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('daypass')} title={passer.name} subtitle="BACK TO DAY PASSES" />
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-6`}>
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-xl font-bold">
                {passer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#d4ff00] tracking-widest uppercase mb-1">PASS ID: {passer.id}</p>
                <h2 className="text-xl font-black text-white">{passer.name}</h2>
                <p className="text-xs text-zinc-400">Check-in: {passer.date} {passer.time}</p>
              </div>
           </div>

           <Button variant="danger" className="w-full py-3 text-xs" onClick={() => onDelete(passer.id)}>
              <Trash2 className="w-4 h-4" /> Remove Day Pass
           </Button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">Purchase History</h3>
          <PurchaseHistoryList 
            history={passer.purchaseHistory} 
            onMarkPaid={onMarkPaid} 
          />
        </div>
      </div>
    </div>
  );
};

export default DayPasserDetailScreen;

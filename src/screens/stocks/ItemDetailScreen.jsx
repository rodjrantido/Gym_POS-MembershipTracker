import { Trash2 } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export const ItemDetailScreen = ({ item, navigate, onDelete }) => {
  if (!item) return null;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('stocks')} title={item.name} subtitle="INVENTORY DETAILS" />
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-6 space-y-6`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#d4ff00] tracking-widest uppercase">{item.category}</span>
              <h2 className="text-xl font-black text-white mt-1">{item.name}</h2>
            </div>
            <Badge status={item.stock === 0 ? 'ZERO STOCK' : (item.stock <= item.threshold ? 'LOW' : 'STABLE')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price</span>
              <p className="font-mono text-xl font-black text-[#d4ff00] mt-1">₱{item.price.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Stock</span>
              <p className="font-mono text-xl font-black text-white mt-1">{item.stock} Units</p>
            </div>
          </div>

          <Button variant="danger" className="w-full py-3 text-xs" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4" /> Remove Product
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailScreen;

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Badge from '../../components/Badge';

export const SelectCartItemScreen = ({ inventory, navigate, onAddToCart }) => {
  const [search, setSearch] = useState('');
  const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('home')} title="SELECT PRODUCT" subtitle="POINT OF SALE" />
      <div className="p-4 space-y-4">
        <Input 
          icon={Search} 
          placeholder="Search inventory..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <div className="space-y-2">
          {filtered.map(item => (
            <div 
              key={item.id} 
              onClick={() => {
                if (item.stock > 0) {
                  onAddToCart(item);
                  navigate('home');
                }
              }}
              className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center ${item.stock > 0 ? 'cursor-pointer hover:border-[#d4ff00]/40' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div>
                <h4 className="font-bold text-sm text-zinc-100">{item.name}</h4>
                <p className="text-xs text-zinc-500">{item.category} • Stock: {item.stock}</p>
                <p className="font-mono text-sm text-[#d4ff00] font-bold mt-1">₱{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={item.stock === 0 ? 'ZERO STOCK' : (item.stock <= item.threshold ? 'LOW' : 'STABLE')} />
                {item.stock > 0 && (
                  <button className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4ff00]">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectCartItemScreen;

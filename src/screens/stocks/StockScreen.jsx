import { useState } from 'react';
import { Plus, Search, Box } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export const StockScreen = ({ inventory, navigate, onQuickSell }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Supplements', 'Drinks'];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24">
      <Header 
        title="INVENTORY & STOCK" 
        subtitle="Manage Products" 
        rightAction={
          <Button onClick={() => navigate('add_item')} className="py-2 px-3 text-sm">
            <Plus className="w-4 h-4" /> ADD
          </Button>
        }
      />
      <div className="p-4 space-y-4">
        <Input 
          icon={Search} 
          placeholder="Search products..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-[#d4ff00] text-black shadow-md' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-3 mt-2">
          {filteredInventory.length === 0 ? (
            <EmptyState icon={Box} title="No Products Found" description="Try searching for something else or add a new product." />
          ) : (
            filteredInventory.map(item => (
              <div 
                key={item.id} 
                className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center`}
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => navigate('item_detail', { item })}
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
                    {item.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{item.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono">₱{item.price.toFixed(2)} • {item.stock} left</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={item.stock === 0 ? 'ZERO STOCK' : (item.stock <= item.threshold ? 'LOW' : 'STABLE')} />
                  {item.stock > 0 && (
                    <button 
                      onClick={() => onQuickSell(item.id)}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-[#d4ff00] hover:text-[#d4ff00] text-zinc-300 text-xs font-bold rounded-lg transition-colors"
                      title="Sell 1 unit directly"
                    >
                      -1
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StockScreen;

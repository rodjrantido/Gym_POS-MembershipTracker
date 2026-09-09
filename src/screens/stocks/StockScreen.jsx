import { useState } from 'react';
import { Plus, Search, Box, PackagePlus, X, Check, ArrowRight } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export const StockScreen = ({ inventory, navigate, onQuickSell, onRestock }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('10');
  const [savingRestock, setSavingRestock] = useState(false);

  const categories = ['ALL', 'Supplements', 'Drinks'];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenRestock = (item, e) => {
    e.stopPropagation();
    setRestockItem(item);
    setRestockQty('10');
  };

  const handleConfirmRestock = async () => {
    if (!restockItem || !onRestock) return;
    const qtyNum = parseInt(restockQty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    setSavingRestock(true);
    try {
      await onRestock(restockItem.id, qtyNum);
      setRestockItem(null);
    } finally {
      setSavingRestock(false);
    }
  };

  const quickPresets = ['5', '10', '20', '50', '100'];

  const currentStockNum = restockItem ? parseInt(restockItem.stock, 10) || 0 : 0;
  const addingNum = Math.max(0, parseInt(restockQty, 10) || 0);
  const newTotalStock = currentStockNum + addingNum;

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
                className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => navigate('item_detail', { item })}
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs shrink-0">
                    {item.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{item.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono">₱{item.price.toFixed(2)} • <strong className="text-zinc-300">{item.stock} left</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge status={item.stock === 0 ? 'ZERO STOCK' : (item.stock <= item.threshold ? 'LOW' : 'STABLE')} />
                  
                  {/* Restock Button */}
                  <button 
                    type="button"
                    onClick={(e) => handleOpenRestock(item, e)}
                    className="px-3 py-1.5 bg-[#d4ff00]/10 border border-[#d4ff00]/30 hover:bg-[#d4ff00] hover:text-black text-[#d4ff00] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Add stock to this product"
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> Restock
                  </button>

                  {/* Direct -1 Quick Sell */}
                  {item.stock > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickSell(item.id);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 hover:text-red-400 text-zinc-400 text-xs font-bold rounded-lg transition-colors active:scale-95"
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

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-[#d4ff00] uppercase tracking-widest">RESTOCK INVENTORY</p>
                <h3 className="text-lg font-black text-white">{restockItem.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Current Stock: <strong className="text-zinc-200 font-mono">{currentStockNum} units</strong></p>
              </div>
              <button 
                onClick={() => setRestockItem(null)}
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                Quantity to Add
              </label>
              <Input 
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                disabled={savingRestock}
                autoFocus
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockQty(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${restockQty === preset ? 'bg-[#d4ff00] text-black shadow' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Stock Preview */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 flex justify-between items-center text-xs">
              <span className="text-zinc-400">Projected Total Stock:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold">
                <span className="text-zinc-400">{currentStockNum}</span>
                <span className="text-zinc-600">+</span>
                <span className="text-[#d4ff00]">+{addingNum}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-white text-sm bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">{newTotalStock}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="secondary" 
                className="py-3 text-xs" 
                onClick={() => setRestockItem(null)}
                disabled={savingRestock}
              >
                CANCEL
              </Button>
              <Button 
                variant="primary" 
                className="py-3 text-xs shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
                onClick={handleConfirmRestock}
                disabled={savingRestock || addingNum <= 0}
              >
                <Check className="w-4 h-4" /> CONFIRM (+{addingNum})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockScreen;

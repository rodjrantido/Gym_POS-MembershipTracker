import { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

export const AddItemScreen = ({ navigate, onSave, inventory = [] }) => {
  const [formData, setFormData] = useState({
    name: '', category: 'Supplements', price: '', stock: '', threshold: '5'
  });

  const categories = ['Supplements', 'Drinks'];

  const trimmedName = formData.name.trim();
  const existingDuplicate = inventory.find(
    item => item.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  const isDuplicate = Boolean(existingDuplicate && trimmedName.length > 0);

  const handleSave = () => {
    if (isDuplicate || !formData.name || !formData.price || !formData.stock) return;

    onSave({
      ...formData,
      name: trimmedName,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      threshold: parseInt(formData.threshold, 10) || 5
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('stocks')} title="ADD PRODUCT" subtitle="INVENTORY" />
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-5 space-y-4`}>
          <div>
            <Input 
              label="Product Name" 
              placeholder="e.g., Whey Protein (Chocolate)" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            
            {/* Duplicate Product Name Warning */}
            {isDuplicate && (
              <div className="mt-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs space-y-1 animate-in fade-in duration-200">
                <p className="font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Product Name Already Exists
                </p>
                <p className="text-zinc-300 text-[11px]">
                  A product with the exact name <strong className="text-white">"{trimmedName}"</strong> is already in inventory.
                </p>
                <p className="text-zinc-400 text-[11px] pt-0.5">
                  To add a variant or flavor, please specify details in parentheses:
                </p>
                <p className="text-[#d4ff00] font-mono text-[11px]">
                  e.g., "{trimmedName} (Chocolate)" or "{trimmedName} (Vanilla)"
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({...formData, category: c})}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all ${formData.category === c ? 'bg-[#d4ff00] text-black border-[#d4ff00]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Price (₱)" type="number" placeholder="0.00" 
              value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
            />
            <Input 
              label="Initial Stock" type="number" placeholder="0" 
              value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
            />
          </div>
          <Input 
            label="Low Stock Alert Threshold" type="number" placeholder="5" 
            value={formData.threshold} onChange={e => setFormData({...formData, threshold: e.target.value})}
          />
        </div>
        <Button 
          className="w-full text-lg py-4 shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
          onClick={handleSave}
          disabled={!formData.name || !formData.price || !formData.stock || isDuplicate}
        >
          <CheckCircle className="w-5 h-5" /> {isDuplicate ? 'SPECIFY UNIQUE PRODUCT NAME' : 'SAVE PRODUCT'}
        </Button>
      </div>
    </div>
  );
};

export default AddItemScreen;

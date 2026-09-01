import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

export const AddItemScreen = ({ navigate, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', category: 'Supplements', price: '', stock: '', threshold: '5'
  });

  const categories = ['Supplements', 'Drinks'];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('stocks')} title="ADD PRODUCT" subtitle="INVENTORY" />
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-5 space-y-4`}>
          <Input 
            label="Product Name" placeholder="e.g., Whey Protein 1lb" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
          />
          
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
          onClick={() => onSave({ ...formData, price: parseFloat(formData.price) || 0, stock: parseInt(formData.stock) || 0, threshold: parseInt(formData.threshold) || 5 })}
          disabled={!formData.name || !formData.price || !formData.stock}
        >
          <CheckCircle className="w-5 h-5" /> SAVE PRODUCT
        </Button>
      </div>
    </div>
  );
};

export default AddItemScreen;

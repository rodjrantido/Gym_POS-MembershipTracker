import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

export const AddDayPasserScreen = ({ navigate, onSave }) => {
  const [formData, setFormData] = useState({ name: '' });

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('daypass')} title="NEW DAY PASS" />
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-5 space-y-5`}>
          <Input 
            label="Visitor Name" placeholder="e.g., Maria Santos" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm font-medium">Pass Type</span>
              <span className="text-zinc-100 font-bold">Standard 1-Day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm font-medium">Amount Due</span>
              <span className="text-[#d4ff00] font-mono text-xl font-bold">50.00</span>
            </div>
          </div>
        </div>
        <Button 
          className="w-full text-lg py-4 shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
          onClick={() => onSave(formData)}
          disabled={!formData.name}
        >
          <CheckCircle className="w-5 h-5" /> CONFIRM & CHECK-IN
        </Button>
      </div>
    </div>
  );
};

export default AddDayPasserScreen;

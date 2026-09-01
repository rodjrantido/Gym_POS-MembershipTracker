import { useState } from 'react';
import { CheckCircle, Camera, Loader2, CreditCard } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import CameraCaptureModal from '../../components/CameraCaptureModal';

export const AddMemberScreen = ({ navigate, onSave }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    amount: '500',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculate duration based on amount (₱500 = 1 month / 30 days)
  const amountNum = Math.max(0, parseFloat(formData.amount) || 0);
  const calculatedMonths = Math.max(1, Math.floor(amountNum / 500) || 1);
  const calculatedDays = calculatedMonths * 30;
  const planName = calculatedMonths === 1 
    ? '1 Month Plan (500)' 
    : `${calculatedMonths} Months Plan (${amountNum.toLocaleString()})`;

  const now = new Date();
  const expiryDateObj = new Date(now.getTime() + calculatedDays * 24 * 60 * 60 * 1000);
  const expiryDateISO = expiryDateObj.toISOString().split('T')[0];
  const expiryDateFormatted = expiryDateObj.toLocaleDateString();

  const handleCapturePhoto = (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      
      await onSave({
        name: formData.name,
        phone: formData.phone,
        plan: planName,
        amount: amountNum,
        months: calculatedMonths,
        startDate,
        expiresAt: expiryDateISO,
        photoFile,
      });
    } finally {
      setSaving(false);
    }
  };

  const quickPresets = [
    { label: '1 Mo', amount: '500' },
    { label: '2 Mos', amount: '1000' },
    { label: '3 Mos', amount: '1500' },
    { label: '6 Mos', amount: '3000' },
    { label: '1 Year', amount: '6000' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('members')} title="NEW MEMBER" subtitle="REGISTRATION" />
      
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-5 space-y-5`}>
          
          {/* Photo Upload Container */}
          <div className="flex flex-col items-center justify-center">
            <div 
              onClick={() => setIsCameraOpen(true)}
              className="relative w-28 h-28 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:border-[#d4ff00] hover:text-[#d4ff00] transition-colors cursor-pointer overflow-hidden group shadow-lg"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold uppercase">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <Camera className="w-7 h-7 mb-1 text-zinc-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Take Photo</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Tap to take photo or choose from gallery</p>
          </div>

          <Input 
            label="Full Name" 
            placeholder="e.g., Juan Dela Cruz" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            disabled={saving}
          />
          
          <Input 
            label="Phone Number" 
            placeholder="+63 900 000 0000" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})}
            disabled={saving}
          />

          {/* Membership Amount & Duration Calculation */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Membership Payment Amount 
              </label>
              <span className="text-[10px] text-[#d4ff00] font-bold">₱500 = 1 Month</span>
            </div>

            <Input 
              icon={CreditCard}
              type="number"
              step="500"
              min="500"
              placeholder="e.g., 1500 for 3 months" 
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})}
              disabled={saving}
            />

            {/* Quick Duration Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickPresets.map(preset => (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: preset.amount })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.amount === preset.amount ? 'bg-[#d4ff00] text-black shadow-md' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                >
                  {preset.label} ({parseInt(preset.amount).toLocaleString()})
                </button>
              ))}
            </div>
          </div>

          {/* Plan Summary Card */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Calculated Plan</span>
              <span className="text-zinc-100 font-bold text-sm">{planName}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-900 pt-2 text-xs">
              <span className="text-zinc-500">Duration</span>
              <span className="text-[#d4ff00] font-bold">{calculatedMonths} {calculatedMonths === 1 ? 'Month' : 'Months'} ({calculatedDays} Days)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Valid Until</span>
              <span className="text-zinc-200 font-mono font-bold">{expiryDateFormatted}</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full text-lg py-4 shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
          onClick={handleCreate}
          disabled={!formData.name || saving || amountNum < 500}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              REGISTERING MEMBER...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" /> CREATE MEMBERSHIP ({amountNum.toLocaleString()})
            </>
          )}
        </Button>
      </div>

      {/* Live Camera & Gallery Modal */}
      <CameraCaptureModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};

export default AddMemberScreen;

import { useState } from 'react';
import { CheckCircle, Camera, Loader2, CreditCard, Calendar, Clock } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import CameraCaptureModal from '../../components/CameraCaptureModal';

import { getLocalDateString, addDaysToDate, formatDateDisplay } from '../../utils/dateUtils';

export const AddMemberScreen = ({ navigate, onSave }) => {
  const [memberType, setMemberType] = useState('NEW'); // 'NEW' (paying standard plan) or 'EXISTING' (custom days left)
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    amount: '500',
    customDays: '30',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculations
  const amountNum = Math.max(0, parseFloat(formData.amount) || 0);
  const customDaysNum = Math.max(1, parseInt(formData.customDays, 10) || 1);

  // Determine duration and plan based on memberType
  const calculatedMonths = memberType === 'NEW' 
    ? Math.max(1, Math.floor(amountNum / 500) || 1)
    : Math.ceil(customDaysNum / 30);
  
  const calculatedDays = memberType === 'NEW' 
    ? calculatedMonths * 30 
    : customDaysNum;

  const planName = memberType === 'NEW'
    ? (calculatedMonths === 1 ? '1 Month Plan (₱500)' : `${calculatedMonths} Months Plan (₱${amountNum.toLocaleString()})`)
    : `Existing Plan (${calculatedDays} Days Left)`;

  const now = new Date();
  const expiryDateISO = addDaysToDate(now, calculatedDays);
  const expiryDateFormatted = formatDateDisplay(expiryDateISO);

  const handleCapturePhoto = (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const startDate = getLocalDateString(now);
      
      await onSave({
        name: formData.name,
        phone: formData.phone,
        plan: planName,
        amount: memberType === 'NEW' ? amountNum : 0,
        months: calculatedMonths,
        days: calculatedDays,
        startDate,
        expiresAt: expiryDateISO,
        photoFile,
        isExistingImport: memberType === 'EXISTING',
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

  const quickDayPresets = [
    { label: '7 Days', days: '7' },
    { label: '14 Days', days: '14' },
    { label: '20 Days', days: '20' },
    { label: '30 Days', days: '30' },
    { label: '60 Days', days: '60' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('members')} title="NEW MEMBER" subtitle="REGISTRATION" />
      
      <div className="p-4 space-y-5">
        
        {/* Mode Selector: New Member vs Existing Member Import */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setMemberType('NEW')}
            className={`py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${memberType === 'NEW' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => setMemberType('EXISTING')}
            className={`py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${memberType === 'EXISTING' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Existing Member
          </button>
        </div>

        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-5 space-y-4`}>
          
          {/* Photo Upload Container */}
          <div className="flex flex-col items-center justify-center">
            <div 
              onClick={() => setIsCameraOpen(true)}
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:border-[#d4ff00] hover:text-[#d4ff00] transition-colors cursor-pointer overflow-hidden group shadow-lg"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[8px] font-bold uppercase">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1 text-zinc-400" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">Take Photo</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5">Tap to take photo or choose from gallery</p>
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

          {/* New Member Standard Payment Plan */}
          {memberType === 'NEW' ? (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Payment Amount (₱)
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

              <div className="flex flex-wrap gap-2 pt-1">
                {quickPresets.map(preset => (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: preset.amount })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.amount === preset.amount ? 'bg-[#d4ff00] text-black shadow-md' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {preset.label} (₱{parseInt(preset.amount).toLocaleString()})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Existing Member Custom Days Input */
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Remaining Days Left
                </label>
                <span className="text-[10px] text-[#d4ff00] font-bold">Custom Duration</span>
              </div>

              <Input 
                icon={Clock}
                type="number"
                min="1"
                placeholder="e.g., 14 days" 
                value={formData.customDays} 
                onChange={e => setFormData({...formData, customDays: e.target.value})}
                disabled={saving}
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {quickDayPresets.map(preset => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setFormData({ ...formData, customDays: preset.days })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.customDays === preset.days ? 'bg-[#d4ff00] text-black shadow-md' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan & Expiration Summary Card */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2.5 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Plan Name</span>
              <span className="text-zinc-100 font-bold text-sm">{planName}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-900 pt-2 text-xs">
              <span className="text-zinc-500">Days Remaining</span>
              <span className="text-[#d4ff00] font-bold">{calculatedDays} Days</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Expiration Date
              </span>
              <span className="text-zinc-200 font-mono font-bold">{expiryDateFormatted}</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full text-base py-4 shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
          onClick={handleCreate}
          disabled={!formData.name || saving || (memberType === 'NEW' && amountNum < 500)}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              SAVING MEMBER...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" /> 
              {memberType === 'NEW' 
                ? `CREATE MEMBERSHIP (₱${amountNum.toLocaleString()})`
                : `SAVE EXISTING MEMBER (${calculatedDays} DAYS)`}
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

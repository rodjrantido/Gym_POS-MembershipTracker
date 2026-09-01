import { useState } from 'react';
import { Trash2, Camera, Calendar, RefreshCw, Loader2, Clock, Check, Edit3 } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import PurchaseHistoryList from '../../components/PurchaseHistoryList';
import CameraCaptureModal from '../../components/CameraCaptureModal';

export const MemberDetailScreen = ({ 
  member, 
  navigate, 
  onDelete, 
  onMarkPaid, 
  onRenew, 
  onUpdatePhoto,
  onUpdateExpiration 
}) => {
  const [renewing, setRenewing] = useState(false);
  const [renewAmount, setRenewAmount] = useState('500');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Direct Days Left Adjustment State
  const [isAdjustingDays, setIsAdjustingDays] = useState(false);
  const [savingDays, setSavingDays] = useState(false);
  const [targetDays, setTargetDays] = useState('30');

  if (!member) return null;

  // Calculate Expiration & Status
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysRemaining = 0;
  let isExpired = false;
  let isExpiringSoon = false;
  let expiryDateFormatted = 'N/A';

  if (member.expiresAt || member.expires_at) {
    const expiryDate = new Date(member.expiresAt || member.expires_at);
    expiryDateFormatted = expiryDate.toLocaleDateString();
    const diffTime = expiryDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      isExpired = true;
    } else if (daysRemaining <= 5) {
      isExpiringSoon = true;
    }
  }

  const computedStatus = isExpired ? 'EXPIRED' : (isExpiringSoon ? 'EXPIRING SOON' : 'ACTIVE');

  // Multi-month renewal calculations (₱500 = 1 month / 30 days)
  const renewAmountNum = Math.max(0, parseFloat(renewAmount) || 0);
  const renewMonths = Math.max(1, Math.floor(renewAmountNum / 500) || 1);
  const renewDays = renewMonths * 30;

  const handleRenewClick = async () => {
    setRenewing(true);
    try {
      await onRenew(member.id, {
        amount: renewAmountNum,
        months: renewMonths,
        days: renewDays,
      });
    } finally {
      setRenewing(false);
    }
  };

  const handleCapturePhoto = async (file) => {
    if (file && onUpdatePhoto) {
      setUploadingPhoto(true);
      try {
        await onUpdatePhoto(member.id, file);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  // Adjust remaining days calculations
  const targetDaysNum = parseInt(targetDays, 10) || 0;
  const newAdjustedDateObj = new Date(today.getTime() + targetDaysNum * 24 * 60 * 60 * 1000);
  const newAdjustedDateISO = newAdjustedDateObj.toISOString().split('T')[0];
  const newAdjustedDateFormatted = newAdjustedDateObj.toLocaleDateString();


  const handleSaveDaysLeft = async () => {
    if (targetDaysNum <= 0 || !onUpdateExpiration) return;
    setSavingDays(true);
    try {
      await onUpdateExpiration(member.id, newAdjustedDateISO);
      setIsAdjustingDays(false);
    } finally {
      setSavingDays(false);
    }
  };

  const renewalPresets = [
    { label: '+1 Mo', amount: '500' },
    { label: '+2 Mos', amount: '1000' },
    { label: '+3 Mos', amount: '1500' },
    { label: '+6 Mos', amount: '3000' },
    { label: '+1 Yr', amount: '6000' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('members')} title={member.name} subtitle="BACK TO MEMBERS" />
      
      <div className="p-4 space-y-6">
        <div className={`${THEME.card} border ${THEME.border} rounded-xl p-6`}>
           
           {/* Profile Photo & Info */}
           <div className="flex items-center gap-4 mb-6">
              <div 
                onClick={() => setIsCameraOpen(true)}
                className="relative w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 font-bold text-xl overflow-hidden cursor-pointer group shadow-md"
                title="Click to update photo"
              >
                {member.photoUrl || member.photo_url ? (
                  <img 
                    src={member.photoUrl || member.photo_url} 
                    alt={member.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-zinc-400">{member.name.substring(0, 2).toUpperCase()}</span>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span className="text-[8px] uppercase font-bold mt-0.5">Edit</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#d4ff00] tracking-widest uppercase mb-1">MEMBER ID: {member.id}</p>
                <h2 className="text-xl font-black text-white">{member.name}</h2>
                <p className="text-xs text-zinc-400">{member.phone}</p>
              </div>
           </div>
           
           {/* Plan & Status Card */}
           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Current Plan</p>
                  <p className="text-sm font-bold text-zinc-100">{member.plan || 'Monthly'}</p>
                </div>
                <Badge status={computedStatus} />
              </div>

              {/* Expiration Details */}
              <div className="pt-2.5 border-t border-zinc-900 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Valid Until:</span>
                  <span className="text-zinc-200 font-mono font-bold">{expiryDateFormatted}</span>
                </div>
                
                <div className="font-bold">
                  {isExpired ? (
                    <span className="text-red-400">Expired {Math.abs(daysRemaining)} days ago</span>
                  ) : isExpiringSoon ? (
                    <span className="text-yellow-400 font-bold">{daysRemaining} days remaining</span>
                  ) : (
                    <span className="text-[#d4ff00]">{daysRemaining} days remaining</span>
                  )}
                </div>
              </div>

              {/* Toggle Manual Days Left Adjustment */}
              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdjustingDays(!isAdjustingDays)}
                  className="text-xs text-[#d4ff00] font-bold hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isAdjustingDays ? 'Close Adjustment' : 'Adjust Days Remaining'}
                </button>
              </div>
           </div>

           {/* Manual Days Left Adjustment Box */}
           {isAdjustingDays && (
             <div className="bg-zinc-900/90 p-4 rounded-xl border border-[#d4ff00]/30 space-y-3 mb-5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#d4ff00]" /> Set Remaining Days
                  </span>
                  <span className="text-[10px] text-zinc-400">Expires: <strong className="text-zinc-200">{newAdjustedDateFormatted}</strong></span>
                </div>

                <Input 
                  type="number"
                  min="1"
                  placeholder="e.g. 15"
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  disabled={savingDays}
                />

                {/* Quick adjustments */}
                <div className="flex flex-wrap gap-1.5">
                  {['7', '14', '21', '30', '60'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetDays(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${targetDays === d ? 'bg-[#d4ff00] text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>

                <Button 
                  variant="primary" 
                  className="w-full py-3 text-xs shadow-md mt-2"
                  onClick={handleSaveDaysLeft}
                  disabled={savingDays || targetDaysNum <= 0}
                >
                  {savingDays ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> SAVING EXPIRATION...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> SAVE {targetDaysNum} DAYS REMAINING
                    </>
                  )}
                </Button>
             </div>
           )}

           {/* Renew Plan Action Box */}
           <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Renew Plan</span>
                <span className="text-[10px] text-[#d4ff00] font-bold">+{renewMonths} {renewMonths === 1 ? 'Month' : 'Months'} (+{renewDays} Days)</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {renewalPresets.map(preset => (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => setRenewAmount(preset.amount)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${renewAmount === preset.amount ? 'bg-[#d4ff00] text-black shadow' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {preset.label} (₱{parseInt(preset.amount).toLocaleString()})
                  </button>
                ))}
              </div>

              <Button 
                variant="primary" 
                className="w-full py-3.5 text-xs shadow-[0_0_15px_rgba(212,255,0,0.15)] mt-2"
                onClick={handleRenewClick}
                disabled={renewing || renewAmountNum < 500}
              >
                {renewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> RENEWING MEMBERSHIP...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" /> RENEW (+{renewMonths} {renewMonths === 1 ? 'MO' : 'MOS'} • ₱{renewAmountNum.toLocaleString()})
                  </>
                )}
              </Button>
           </div>

           <Button variant="danger" className="w-full py-3 text-xs" onClick={() => onDelete(member.id)}>
              <Trash2 className="w-4 h-4" /> Remove Member
           </Button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">Purchase & Renewal History</h3>
          <PurchaseHistoryList 
            history={member.purchaseHistory} 
            onMarkPaid={onMarkPaid} 
          />
        </div>
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

export default MemberDetailScreen;

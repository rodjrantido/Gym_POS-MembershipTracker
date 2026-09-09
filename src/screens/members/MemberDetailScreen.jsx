import { useState } from 'react';
import { 
  Trash2, Camera, Calendar, RefreshCw, Loader2, Clock, Check, Edit3, 
  PauseCircle, PlayCircle, X
} from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import PurchaseHistoryList from '../../components/PurchaseHistoryList';
import CameraCaptureModal from '../../components/CameraCaptureModal';
import { 
  calculateDaysRemaining, getMemberStatus, formatDateDisplay, 
  addDaysToDate, getMemberPauseInfo, calculateDaysBetween, getLocalDateString 
} from '../../utils/dateUtils';

export const MemberDetailScreen = ({ 
  member, 
  navigate, 
  onDelete, 
  onMarkPaid, 
  onRenew, 
  onUpdatePhoto,
  onUpdateExpiration,
  onPauseMember,
  onUnpauseMember
}) => {
  const [renewing, setRenewing] = useState(false);
  const [renewAmount, setRenewAmount] = useState('500');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Direct Days Left Adjustment State
  const [isAdjustingDays, setIsAdjustingDays] = useState(false);
  const [savingDays, setSavingDays] = useState(false);
  const [targetDays, setTargetDays] = useState('30');

  // Pause / Unpause State
  const [pausing, setPausing] = useState(false);
  const [unpausing, setUnpausing] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  if (!member) return null;

  // Calculate Expiration & Status safely
  const pauseInfo = getMemberPauseInfo(member);
  const isPaused = Boolean(pauseInfo?.isPaused);
  const computedStatus = getMemberStatus(member);
  const daysRemaining = calculateDaysRemaining(member.expiresAt || member.expires_at);
  const isExpired = computedStatus === 'EXPIRED';
  const isExpiringSoon = computedStatus === 'EXPIRING SOON';
  const expiryDateFormatted = formatDateDisplay(member.expiresAt || member.expires_at);

  // How many days has it been paused?
  const todayStr = getLocalDateString();
  const elapsedPausedDays = isPaused && pauseInfo?.pausedDate 
    ? calculateDaysBetween(pauseInfo.pausedDate, todayStr)
    : 0;

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

  // Adjust remaining days calculations safely in local time
  const targetDaysNum = parseInt(targetDays, 10) || 0;
  const newAdjustedDateISO = addDaysToDate(new Date(), targetDaysNum);
  const newAdjustedDateFormatted = formatDateDisplay(newAdjustedDateISO);

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

  const handleConfirmPause = async () => {
    if (!onPauseMember) return;
    setPausing(true);
    try {
      await onPauseMember(member.id);
      setShowPauseModal(false);
    } finally {
      setPausing(false);
    }
  };

  const handleConfirmUnpause = async () => {
    if (!onUnpauseMember) return;
    setUnpausing(true);
    try {
      await onUnpauseMember(member.id);
    } finally {
      setUnpausing(false);
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

           {/* Paused Membership Alert Banner */}
           {isPaused && (
             <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 mb-5 space-y-2 animate-in fade-in duration-200">
               <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                 <PauseCircle className="w-4 h-4" /> Membership Plan is Paused
               </div>
               <p className="text-xs text-zinc-300">
                 This membership was paused on <strong className="text-white">{formatDateDisplay(pauseInfo?.pausedDate)}</strong> ({elapsedPausedDays} {elapsedPausedDays === 1 ? 'day' : 'days'} ago).
               </p>
               <p className="text-[11px] text-blue-300">
                 Saved remaining balance: <strong className="text-white font-mono">{pauseInfo?.savedRemainingDays ?? daysRemaining} days</strong>. When you unpause, the expiration date will automatically advance by the paused duration!
               </p>
             </div>
           )}
           
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
                  <span className="text-zinc-200 font-mono font-bold">
                    {isPaused ? 'On Hold (Paused)' : expiryDateFormatted}
                  </span>
                </div>
                
                <div className="font-bold">
                  {isPaused ? (
                    <span className="text-blue-400 font-bold">
                      {pauseInfo?.savedRemainingDays ?? daysRemaining} days saved
                    </span>
                  ) : isExpired ? (
                    <span className="text-red-400">Expired {Math.abs(daysRemaining)} days ago</span>
                  ) : isExpiringSoon ? (
                    <span className="text-yellow-400 font-bold">{daysRemaining} days remaining</span>
                  ) : (
                    <span className="text-[#d4ff00]">{daysRemaining} days remaining</span>
                  )}
                </div>
              </div>

              {/* Toggle Manual Days Left Adjustment */}
              {!isPaused && (
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
              )}
           </div>

           {/* Manual Days Left Adjustment Box */}
           {isAdjustingDays && !isPaused && (
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

           {/* PAUSE / UNPAUSE ACTION BUTTON */}
           <div className="mb-5">
             {isPaused ? (
               <Button
                 variant="primary"
                 className="w-full py-3.5 text-xs shadow-[0_0_15px_rgba(212,255,0,0.25)] font-bold tracking-wider"
                 onClick={handleConfirmUnpause}
                 disabled={unpausing}
               >
                 {unpausing ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" /> RESUMING MEMBERSHIP...
                   </>
                 ) : (
                   <>
                     <PlayCircle className="w-4 h-4" /> UNPAUSE MEMBERSHIP (RESUME PLAN)
                   </>
                 )}
               </Button>
             ) : (
               <Button
                 variant="secondary"
                 className="w-full py-3 text-xs border border-zinc-800 hover:border-blue-500/50 hover:text-blue-400 text-zinc-300 font-bold tracking-wider transition-all"
                 onClick={() => setShowPauseModal(true)}
                 disabled={pausing}
               >
                 <PauseCircle className="w-4 h-4 text-blue-400" /> PAUSE MEMBERSHIP PLAN
               </Button>
             )}
           </div>

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

      {/* Pause Confirmation Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5 text-blue-400">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Pause Membership?</h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{member.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPauseModal(false)}
                className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Expiration:</span>
                <span className="font-mono text-zinc-200 font-bold">{expiryDateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Days to be Frozen/Saved:</span>
                <span className="font-mono text-[#d4ff00] font-bold">{daysRemaining > 0 ? daysRemaining : 0} days</span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                While paused, the member's countdown will freeze. When unpaused later, their expiration date will be pushed forward by the exact number of days they were paused!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button 
                variant="secondary" 
                className="py-3 text-xs" 
                onClick={() => setShowPauseModal(false)}
                disabled={pausing}
              >
                CANCEL
              </Button>
              <Button 
                variant="primary" 
                className="py-3 text-xs bg-blue-500 hover:bg-blue-400 text-white border-none shadow-[0_0_15px_rgba(59,130,246,0.25)]" 
                onClick={handleConfirmPause}
                disabled={pausing}
              >
                {pausing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> PAUSING...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> CONFIRM PAUSE
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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

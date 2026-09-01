import { Calendar, Clock, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import Badge from './Badge';
import EmptyState from './EmptyState';

export const PurchaseHistoryList = ({ history, onMarkPaid }) => {
  if (!history || history.length === 0) {
    return <EmptyState icon={Receipt} title="No Purchases" description="This customer hasn't made any purchases yet." />;
  }

  return (
    <div className="space-y-3">
      {history.map((record) => {
        const isUnpaid = record.status === 'UNPAID';
        const wasUnpaidAndNowPaid = record.status === 'PAID' && (record.wasUnpaid || record.paidDate);

        return (
          <div 
            key={record.transactionId} 
            className={`bg-zinc-900 border ${isUnpaid ? 'border-red-500/30' : 'border-zinc-800'} rounded-xl p-4 transition-all`}
          >
            {/* Header: Transaction ID, Amount, Badge */}
            <div className="flex justify-between items-start mb-3 border-b border-zinc-800/50 pb-3">
              <div>
                <p className="text-sm font-bold text-zinc-100">Transaction {record.transactionId}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  <span>{record.date}</span>
                  <Clock className="w-3 h-3 text-zinc-500 ml-1" />
                  <span>{record.time}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono font-bold text-[#d4ff00] text-base">₱{record.totalAmount.toFixed(2)}</span>
                <Badge status={record.status} />
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-1 py-1">
              {record.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">{item.qty}x {item.name}</span>
                  <span className="text-zinc-500">₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* If marked paid later: Show payment audit timestamp */}
            {wasUnpaidAndNowPaid && (
              <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] bg-[#d4ff00]/5 px-3 py-2 rounded-lg border border-[#d4ff00]/20">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle className="w-3.5 h-3.5 text-[#d4ff00]" />
                  <span>
                    Marked Paid on <strong className="text-zinc-100">{record.paidDate}</strong> at <strong className="text-zinc-100">{record.paidTime}</strong>
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                  Was Unpaid
                </span>
              </div>
            )}

            {/* If still UNPAID: Show Pay Now Button */}
            {isUnpaid && (
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Payment Pending</span>
                </div>
                {onMarkPaid && (
                  <button
                    onClick={() => onMarkPaid(record.transactionId)}
                    className="px-3 py-1.5 bg-[#d4ff00] text-black font-bold text-xs rounded-lg hover:bg-[#bce600] active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,255,0,0.2)]"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PurchaseHistoryList;

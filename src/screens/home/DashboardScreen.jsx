import { ShoppingBag, Users, AlertCircle, Plus, LogOut } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export const DashboardScreen = ({ 
  cart, 
  members, 
  inventory, 
  activeCustomer, 
  totalAmount, 
  navigate, 
  onClearCart, 
  onCheckout,
  onLogout 
}) => {
  const activeMembersCount = members.filter(m => m.status === 'ACTIVE').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.threshold).length;

  return (
    <div className="animate-in fade-in duration-300 pb-24">
      {/* App Header */}
      <div className="pt-12 pb-6 px-6 bg-zinc-950 sticky top-0 z-40 border-b border-zinc-900/50">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#d4ff00] uppercase tracking-widest">SYSTEM ONLINE</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-100">KUYAJEFF'S GYM</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onLogout}
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Metric Cards (Clickable Quick Nav) */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('members')}
            className={`${THEME.card} border ${THEME.border} rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#d4ff00]/50 hover:bg-zinc-900/80 active:scale-[0.98] transition-all group shadow-sm`}
            title="View Active Members"
          >
            <div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Active Members</p>
              <h2 className="text-3xl font-black mt-1 text-white tracking-tight">{activeMembersCount}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-[#d4ff00]/10 flex items-center justify-center text-[#d4ff00] transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          
          <div 
            onClick={() => navigate('stocks')}
            className={`${THEME.card} border ${THEME.border} rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-red-500/50 hover:bg-zinc-900/80 active:scale-[0.98] transition-all group shadow-sm`}
            title="View Inventory & Low Stock"
          >
            <div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Low Stock</p>
              <h2 className="text-3xl font-black mt-1 text-white tracking-tight">{lowStockCount}</h2>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-zinc-900 ${lowStockCount > 0 ? 'text-red-400 group-hover:bg-red-500/10' : 'text-zinc-500'} flex items-center justify-center transition-colors`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* POS Station */}
        <div className={`${THEME.card} border ${THEME.border} rounded-2xl p-5 space-y-5`}>
          <div className="flex justify-between items-center">
            <h2 className="font-black text-sm uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#d4ff00]" /> POS Station
            </h2>
            {cart.length > 0 && (
              <button onClick={onClearCart} className="text-xs text-red-400 font-bold hover:underline">
                Clear Cart
              </button>
            )}
          </div>

          {/* Active Customer Selector */}
          <div 
            onClick={() => navigate('select_customer')}
            className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${activeCustomer ? 'border-[#d4ff00]/40 bg-[#d4ff00]/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs">
                {activeCustomer ? activeCustomer.name.substring(0,2).toUpperCase() : <Users className="w-4 h-4 text-zinc-400"/>}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">
                  {activeCustomer ? activeCustomer.name : 'Select Customer'}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {activeCustomer ? `${activeCustomer.type} • ${activeCustomer.id}` : 'Tap to assign'}
                </p>
              </div>
            </div>
            <span className="text-[#d4ff00] text-xs font-bold uppercase tracking-wider">Change</span>
          </div>

          {/* Cart Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span>Cart Items ({cart.reduce((a, b) => a + b.qty, 0)})</span>
              <button onClick={() => navigate('select_cart_item')} className="text-[#d4ff00] flex items-center gap-1 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {cart.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Cart is Empty" description="Tap 'Add Item' to start building an order." />
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <div>
                      <p className="font-bold text-xs text-zinc-200">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">₱{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-400">x{item.qty}</span>
                      <span className="font-mono font-bold text-[#d4ff00] text-sm">₱{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total & Checkout */}
          <div className="border-t border-zinc-800/80 pt-4 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Amount</p>
                <h3 className="text-3xl font-black text-white font-mono tracking-tight">₱{totalAmount.toFixed(2)}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className="w-full py-4 text-xs tracking-wider" 
                disabled={cart.length === 0 || !activeCustomer}
                onClick={() => onCheckout('UNPAID')}
              >
                PAY LATER
              </Button>
              <Button 
                variant="primary" 
                className="w-full py-4 text-xs tracking-wider shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
                disabled={cart.length === 0 || !activeCustomer}
                onClick={() => onCheckout('PAID')}
              >
                PAY NOW
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;

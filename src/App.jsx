import { useState, useEffect, useCallback } from 'react';
import { THEME } from './constants/theme';
import BottomNav from './components/BottomNav';
import { 
  getLocalDateString, 
  addDaysToDate, 
  parseLocalDate, 
  calculateDaysRemaining, 
  calculateDaysBetween, 
  getMemberPauseInfo 
} from './utils/dateUtils';

// API Services
import {
  authenticateStaff,
  fetchInventory,
  insertInventoryItem,
  updateItemStock,
  deleteInventoryItem,
  fetchMembers,
  insertMember,
  renewMemberPlan,
  updateMemberExpiration,
  pauseMemberPlan,
  unpauseMemberPlan,
  updateMemberPhoto,
  deleteMember,
  uploadMemberPhoto,
  fetchDayPassers,
  insertDayPasser,
  deleteDayPasser,
  fetchTransactions,
  insertTransaction,
  updateTransactionToPaid,
  subscribeToRealtimeChanges,
} from './services/api';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import DashboardScreen from './screens/home/DashboardScreen';
import SelectCustomerScreen from './screens/home/SelectCustomerScreen';
import SelectCartItemScreen from './screens/home/SelectCartItemScreen';
import MembersScreen from './screens/members/MembersScreen';
import MemberDetailScreen from './screens/members/MemberDetailScreen';
import AddMemberScreen from './screens/members/AddMemberScreen';
import DayPassScreen from './screens/daypass/DayPassScreen';
import DayPasserDetailScreen from './screens/daypass/DayPasserDetailScreen';
import AddDayPasserScreen from './screens/daypass/AddDayPasserScreen';
import StockScreen from './screens/stocks/StockScreen';
import ItemDetailScreen from './screens/stocks/ItemDetailScreen';
import AddItemScreen from './screens/stocks/AddItemScreen';

export default function App() {
  // Authentication State
  const [currentStaff, setCurrentStaff] = useState(() => {
    const saved = localStorage.getItem('gym_staff_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Application Data State
  const [inventory, setInventory] = useState([]);
  const [members, setMembers] = useState([]);
  const [dayPassers, setDayPassers] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Unified View Router State
  const [view, setView] = useState({ name: 'home', params: {} });

  // Core Data Loader
  const loadData = useCallback(async () => {
    try {
      const [invData, memData, dpData, trxData] = await Promise.all([
        fetchInventory().catch(() => []),
        fetchMembers().catch(() => []),
        fetchDayPassers().catch(() => []),
        fetchTransactions().catch(() => []),
      ]);

      // Attach transactions & map expiration to members
      const membersWithHistory = memData.map(m => ({
        ...m,
        startDate: m.start_date || m.startDate,
        expiresAt: m.expires_at || m.expiresAt,
        photoUrl: m.photo_url || m.photoUrl,
        purchaseHistory: trxData
          .filter(t => t.customer_id === m.id)
          .map(t => ({
            transactionId: t.transaction_id,
            date: t.date,
            time: t.time,
            totalAmount: parseFloat(t.total_amount),
            status: t.status,
            wasUnpaid: t.was_unpaid || Boolean(t.paid_date),
            paidDate: t.paid_date,
            paidTime: t.paid_time,
            items: t.items || [],
            createdAt: t.created_at
          }))
      }));

      // Attach transactions to day passers
      const dayPassersWithHistory = dpData.map(dp => ({
        ...dp,
        rawDate: dp.raw_date || dp.rawDate,
        purchaseHistory: trxData
          .filter(t => t.customer_id === dp.id)
          .map(t => ({
            transactionId: t.transaction_id,
            date: t.date,
            time: t.time,
            totalAmount: parseFloat(t.total_amount),
            status: t.status,
            wasUnpaid: t.was_unpaid || Boolean(t.paid_date),
            paidDate: t.paid_date,
            paidTime: t.paid_time,
            items: t.items || [],
            createdAt: t.created_at
          }))
      }));

      setInventory(invData);
      setMembers(membersWithHistory);
      setDayPassers(dayPassersWithHistory);
    } catch (err) {
      console.error('Failed to load live data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch live data from Supabase on mount and subscribe to Realtime changes
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      await loadData();
    };

    fetchData();

    // Subscribe to Realtime Postgres Changes
    const unsubscribe = subscribeToRealtimeChanges(() => {
      if (isMounted) {
        loadData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [loadData]);

  // Authentication Handlers
  const handleLogin = async ({ username, password }) => {
    const staff = await authenticateStaff(username, password);
    setCurrentStaff(staff);
    localStorage.setItem('gym_staff_session', JSON.stringify(staff));
  };

  const handleLogout = () => {
    setCurrentStaff(null);
    localStorage.removeItem('gym_staff_session');
    navigate('home');
  };

  // Security Check: render login screen if not authenticated
  if (!currentStaff) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#d4ff00] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Loading KUYAJEFF'S GYM...</p>
      </div>
    );
  }


  const navigate = (name, params = {}) => {
    setView({ name, params });
    window.scrollTo(0, 0);
  };

  // Inventory actions
  const handleSaveItem = async (itemData) => {
    // Prevent duplicate product names (case-insensitive)
    const trimmedName = (itemData.name || '').trim();
    const isDuplicate = inventory.some(
      i => i.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      alert(`A product named "${trimmedName}" already exists. Please specify a unique name (e.g. "${trimmedName} (Variant)").`);
      return;
    }

    const newItem = { ...itemData, name: trimmedName, id: `item_${Date.now()}` };
    try {
      await insertInventoryItem(newItem);
      setInventory(prev => [...prev, newItem]);
    } catch (err) {
      console.warn('Could not save to Supabase, updating locally:', err);
      setInventory(prev => [...prev, newItem]);
    }
    navigate('stocks');
  };

  const handleRestockItem = async (itemId, addedQty) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const currentStock = parseInt(item.stock, 10) || 0;
    const qty = parseInt(addedQty, 10) || 0;
    const newStock = Math.max(0, currentStock + qty);

    try {
      await updateItemStock(itemId, newStock);
    } catch (err) {
      console.warn('Could not update stock in Supabase:', err);
    }

    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, stock: String(newStock) } : i));
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteInventoryItem(id);
    } catch (err) {
      console.warn('Could not delete from Supabase, updating locally:', err);
    }
    setInventory(prev => prev.filter(i => i.id !== id));
    navigate('stocks');
  };

  // Member actions
  const handleSaveMember = async (memberData) => {
    const memberId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    let photoUrl = null;

    // Upload photo to Supabase Storage if present
    if (memberData.photoFile) {
      try {
        photoUrl = await uploadMemberPhoto(memberData.photoFile, memberId);
      } catch (err) {
        console.warn('Photo upload failed:', err);
      }
    }

    const now = new Date();
    const amountPaid = memberData.amount || 0;
    const isNewRegistration = !memberData.isExistingImport && amountPaid > 0;
    const months = memberData.months || Math.max(1, Math.floor(amountPaid / 500));
    
    // Initial registration transaction (only if standard payment)
    let initialTransaction = null;
    if (isNewRegistration) {
      initialTransaction = {
        transactionId: `MEM-${Math.floor(Math.random() * 10000)}`,
        customerId: memberId,
        customerType: 'MEMBER',
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalAmount: amountPaid,
        status: 'PAID',
        wasUnpaid: false,
        items: [{ name: `${months}-Month Membership Registration`, qty: 1, price: amountPaid }]
      };
    }

    const newMember = {
      id: memberId,
      name: memberData.name,
      phone: memberData.phone,
      plan: memberData.plan || (months === 1 ? '1 Month (₱500)' : `${months} Months (₱${amountPaid})`),
      status: 'ACTIVE',
      startDate: memberData.startDate || getLocalDateString(now),
      expiresAt: memberData.expiresAt || addDaysToDate(now, 30),
      photoUrl: photoUrl,
      purchaseHistory: initialTransaction ? [initialTransaction] : []
    };

    try {
      const promises = [insertMember(newMember)];
      if (initialTransaction) {
        promises.push(insertTransaction(initialTransaction));
      }
      await Promise.all(promises);
      setMembers(prev => [newMember, ...prev]);
    } catch (err) {
      console.warn('Could not save member/transaction to Supabase, updating locally:', err);
      setMembers(prev => [newMember, ...prev]);
    }
    navigate('members');
  };

  const handleUpdateMemberPhoto = async (memberId, file) => {
    try {
      const photoUrl = await uploadMemberPhoto(file, memberId);
      if (photoUrl) {
        await updateMemberPhoto(memberId, photoUrl);
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photoUrl } : m));
      }
    } catch (err) {
      console.warn('Could not update photo in Supabase:', err);
    }
  };

  const handleUpdateMemberExpiration = async (memberId, newExpiresAt) => {
    try {
      await updateMemberExpiration(memberId, newExpiresAt);
    } catch (err) {
      console.warn('Could not update member expiration in Supabase:', err);
    }
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          expiresAt: newExpiresAt,
          status: 'ACTIVE'
        };
      }
      return m;
    }));
  };


  const handleRenewMember = async (memberId, renewOptions = {}) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const renewAmount = renewOptions.amount || 500;
    const renewMonths = renewOptions.months || Math.max(1, Math.floor(renewAmount / 500));
    const renewDays = renewOptions.days || (renewMonths * 30);

    // Calculate new expiration (+renewDays from current expiry or today, whichever is later)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentExpiry = member.expiresAt ? parseLocalDate(member.expiresAt) : today;
    const baseDate = currentExpiry > today ? currentExpiry : today;
    const newExpiry = addDaysToDate(baseDate, renewDays);

    const now = new Date();
    const renewalTransaction = {
      transactionId: `RNW-${Math.floor(Math.random() * 10000)}`,
      customerId: member.id,
      customerType: 'MEMBER',
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalAmount: renewAmount,
      status: 'PAID',
      wasUnpaid: false,
      items: [{ name: `Membership Renewal (+${renewMonths} ${renewMonths === 1 ? 'Month' : 'Months'})`, qty: 1, price: renewAmount }]
    };

    try {
      await Promise.all([
        renewMemberPlan(memberId, newExpiry),
        insertTransaction(renewalTransaction)
      ]);
    } catch (err) {
      console.warn('Could not save renewal to Supabase:', err);
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          expiresAt: newExpiry,
          status: 'ACTIVE',
          purchaseHistory: [renewalTransaction, ...(m.purchaseHistory || [])]
        };
      }
      return m;
    }));
  };

  const handlePauseMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const remainingDays = calculateDaysRemaining(member.expiresAt || member.expires_at);
    const todayStr = getLocalDateString();
    const pauseStatus = `PAUSED:${todayStr}:${Math.max(0, remainingDays)}`;

    try {
      await pauseMemberPlan(memberId, pauseStatus);
    } catch (err) {
      console.warn('Could not pause member in Supabase:', err);
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          status: pauseStatus,
        };
      }
      return m;
    }));
  };

  const handleUnpauseMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const pauseInfo = getMemberPauseInfo(member);
    const todayStr = getLocalDateString();
    let newExpiresAt;

    if (pauseInfo && pauseInfo.savedRemainingDays !== null) {
      newExpiresAt = addDaysToDate(new Date(), pauseInfo.savedRemainingDays);
    } else if (pauseInfo && pauseInfo.pausedDate) {
      const daysPaused = calculateDaysBetween(pauseInfo.pausedDate, todayStr);
      newExpiresAt = addDaysToDate(member.expiresAt || member.expires_at, daysPaused);
    } else {
      newExpiresAt = member.expiresAt || member.expires_at || addDaysToDate(new Date(), 30);
    }

    try {
      await unpauseMemberPlan(memberId, newExpiresAt);
    } catch (err) {
      console.warn('Could not unpause member in Supabase:', err);
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          status: 'ACTIVE',
          expiresAt: newExpiresAt,
        };
      }
      return m;
    }));
  };


  const handleDeleteMember = async (id) => {
    try {
      await deleteMember(id);
    } catch (err) {
      console.warn('Could not delete from Supabase, updating locally:', err);
    }
    setMembers(prev => prev.filter(m => m.id !== id));
    navigate('members');
  };

  // Day pass actions
  const handleSaveDayPass = async (passData) => {
    const now = new Date();
    const newPasser = {
      ...passData,
      id: `dp_${Date.now()}`,
      rawDate: getLocalDateString(now),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE',
      purchaseHistory: []
    };

    try {
      await insertDayPasser(newPasser);
      setDayPassers(prev => [newPasser, ...prev]);
    } catch (err) {
      console.warn('Could not save to Supabase, updating locally:', err);
      setDayPassers(prev => [newPasser, ...prev]);
    }
    navigate('daypass');
  };

  const handleDeleteDayPass = async (id) => {
    try {
      await deleteDayPasser(id);
    } catch (err) {
      console.warn('Could not delete from Supabase, updating locally:', err);
    }
    setDayPassers(prev => prev.filter(dp => dp.id !== id));
    navigate('daypass');
  };

  // Cart & POS checkout actions
  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, cartId: Date.now(), qty: 1 }]);
    }
    navigate('home');
  };

  const handleCheckout = async (paymentStatus) => {
    if (!activeCustomer) return;

    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const now = new Date();
    
    const transaction = {
      transactionId: `TRX-${Math.floor(Math.random() * 10000)}`,
      customerId: activeCustomer.id,
      customerType: activeCustomer.type,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalAmount: totalAmount,
      status: paymentStatus,
      wasUnpaid: paymentStatus === 'UNPAID',
      items: cart.map(item => ({ name: item.name, qty: item.qty, price: parseFloat(item.price) })),
      createdAt: now.toISOString(),
    };
    try {
      await insertTransaction(transaction);
    } catch (err) {
      console.warn('Could not save transaction to Supabase:', err);
    }

    // 2. Update Inventory in Supabase & state
    const updatedInventory = inventory.map(invItem => {
      const cartItem = cart.find(c => c.id === invItem.id);
      if (cartItem) {
        const newStock = Math.max(0, parseInt(invItem.stock, 10) - cartItem.qty);
        updateItemStock(invItem.id, newStock).catch(err => console.warn('Could not update stock in Supabase:', err));
        return { ...invItem, stock: String(newStock) };
      }
      return invItem;
    });
    setInventory(updatedInventory);

    // 3. Update Customer History state
    if (activeCustomer.type === 'MEMBER') {
      setMembers(members.map(m => m.id === activeCustomer.id ? { ...m, purchaseHistory: [transaction, ...m.purchaseHistory] } : m));
    } else if (activeCustomer.type === 'DAY_PASSER') {
      setDayPassers(dayPassers.map(dp => dp.id === activeCustomer.id ? { ...dp, purchaseHistory: [transaction, ...dp.purchaseHistory] } : dp));
    }

    setCart([]);
    setActiveCustomer(null);
    navigate('home');
  };

  // Mark an unpaid purchase as PAID (with audit timestamp)
  const handleMarkPaid = async (transactionId) => {
    const now = new Date();
    const paidDate = now.toLocaleDateString();
    const paidTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await updateTransactionToPaid(transactionId, { paidDate, paidTime });
    } catch (err) {
      console.warn('Could not update payment in Supabase, updating locally:', err);
    }

    const updateHistoryList = (list) =>
      list.map(record =>
        record.transactionId === transactionId
          ? {
              ...record,
              status: 'PAID',
              wasUnpaid: true,
              paidDate,
              paidTime,
            }
          : record
      );

    setMembers(prev =>
      prev.map(m => ({
        ...m,
        purchaseHistory: updateHistoryList(m.purchaseHistory || [])
      }))
    );

    setDayPassers(prev =>
      prev.map(dp => ({
        ...dp,
        purchaseHistory: updateHistoryList(dp.purchaseHistory || [])
      }))
    );
  };

  const handleQuickSell = async (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || parseInt(item.stock, 10) <= 0) return;

    const newStock = parseInt(item.stock, 10) - 1;
    try {
      await updateItemStock(itemId, newStock);
    } catch (err) {
      console.warn('Could not update stock in Supabase:', err);
    }

    setInventory(inventory.map(i => {
      if (i.id === itemId) {
        return { ...i, stock: String(newStock) };
      }
      return i;
    }));
  };

  const handleSelectCustomer = (customer) => {
    setActiveCustomer(customer);
    navigate('home');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);

  const renderView = () => {
    switch (view.name) {
      case 'home': 
        return (
          <DashboardScreen 
            cart={cart} 
            members={members} 
            inventory={inventory} 
            activeCustomer={activeCustomer} 
            totalAmount={totalAmount} 
            navigate={navigate} 
            onClearCart={() => setCart([])} 
            onCheckout={handleCheckout} 
            onLogout={handleLogout} 
            onMarkPaid={handleMarkPaid}
          />
        );
      case 'select_customer':
        return (
          <SelectCustomerScreen 
            members={members} 
            dayPassers={dayPassers} 
            navigate={navigate} 
            onSelect={handleSelectCustomer} 
          />
        );
      case 'select_cart_item': 
        return (
          <SelectCartItemScreen 
            inventory={inventory} 
            navigate={navigate} 
            onAddToCart={handleAddToCart}
            onSelect={handleAddToCart}
          />
        );
      case 'members': 
        return (
          <MembersScreen 
            members={members} 
            navigate={navigate} 
          />
        );
      case 'member_detail': {
        const currentMember = members.find(m => m.id === view.params.member.id);
        return (
          <MemberDetailScreen 
            member={currentMember} 
            navigate={navigate} 
            onDelete={handleDeleteMember} 
            onMarkPaid={handleMarkPaid}
            onRenew={handleRenewMember}
            onUpdatePhoto={handleUpdateMemberPhoto}
            onUpdateExpiration={handleUpdateMemberExpiration}
            onPauseMember={handlePauseMember}
            onUnpauseMember={handleUnpauseMember}
          />
        );
      }
      case 'add_member': 
        return (
          <AddMemberScreen 
            navigate={navigate} 
            onSave={handleSaveMember} 
          />
        );
      case 'daypass': 
        return (
          <DayPassScreen 
            dayPassers={dayPassers} 
            navigate={navigate} 
          />
        );
      case 'daypass_detail': {
        const currentPasser = dayPassers.find(dp => dp.id === view.params.passer.id);
        return (
          <DayPasserDetailScreen 
            passer={currentPasser} 
            navigate={navigate} 
            onDelete={handleDeleteDayPass} 
            onMarkPaid={handleMarkPaid}
          />
        );
      }
      case 'add_daypass': 
        return (
          <AddDayPasserScreen 
            navigate={navigate} 
            onSave={handleSaveDayPass} 
          />
        );
      case 'stocks': 
        return (
          <StockScreen 
            inventory={inventory} 
            navigate={navigate} 
            onQuickSell={handleQuickSell} 
            onRestock={handleRestockItem}
          />
        );
      case 'item_detail': 
        return (
          <ItemDetailScreen 
            item={view.params.item} 
            navigate={navigate} 
            onDelete={handleDeleteItem} 
          />
        );
      case 'add_item': 
        return (
          <AddItemScreen 
            inventory={inventory}
            navigate={navigate} 
            onSave={handleSaveItem} 
          />
        );
      default: 
        return (
          <DashboardScreen 
            cart={cart} 
            members={members} 
            inventory={inventory} 
            activeCustomer={activeCustomer} 
            totalAmount={totalAmount} 
            navigate={navigate} 
            onClearCart={() => setCart([])} 
            onCheckout={handleCheckout} 
            onLogout={handleLogout} 
          />
        );
    }
  };

  const activeTab = ['home', 'select_cart_item', 'select_customer'].includes(view.name) ? 'home' 
                  : ['members', 'member_detail', 'add_member'].includes(view.name) ? 'members'
                  : ['daypass', 'daypass_detail', 'add_daypass'].includes(view.name) ? 'daypass'
                  : ['stocks', 'item_detail', 'add_item'].includes(view.name) ? 'stocks' : 'home';

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans selection:bg-[#d4ff00] selection:text-black`}>
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-zinc-950 overflow-hidden ring-1 ring-zinc-900/50">
        <main className="h-full overflow-y-auto hide-scrollbar pb-20">
          {renderView()}
        </main>

        <BottomNav activeTab={activeTab} onNavigate={navigate} />
      </div>
    </div>
  );
}
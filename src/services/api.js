import { getLocalDateString, addDaysToDate } from '../utils/dateUtils';

// Helper for making API calls with consistent error handling
async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

// ==========================================
// === AUTHENTICATION API ===
// ==========================================

export async function authenticateStaff(username, password) {
  const cleanUsername = username?.trim() || '';
  const cleanPassword = password?.trim() || '';

  console.log('[Auth] Attempting login with username:', cleanUsername);

  const data = await apiRequest('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
  });

  return data;
}

// ==========================================
// === STORAGE API (MEMBER PHOTOS) ===
// ==========================================

// Helper to compress image to a lightweight Base64 string (~30-50kb)
export async function compressImageToBase64(file, maxWidth = 350, maxHeight = 350, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function uploadMemberPhoto(file, memberId) {
  if (!file) return null;
  // Compress to lightweight Base64 dataUrl, stored directly in PostgreSQL TEXT column
  const base64Url = await compressImageToBase64(file);
  console.log('[Storage] Processed photo as base64 database record for member:', memberId);
  return base64Url;
}

// ==========================================
// === INVENTORY API ===
// ==========================================

export async function fetchInventory() {
  const data = await apiRequest('/api/inventory');
  return data || [];
}

export async function insertInventoryItem(item) {
  return apiRequest('/api/inventory', {
    method: 'POST',
    body: JSON.stringify({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      stock: parseInt(item.stock, 10),
      threshold: parseInt(item.threshold, 10),
    }),
  });
}

export async function updateItemStock(id, newStock) {
  return apiRequest('/api/inventory', {
    method: 'PUT',
    body: JSON.stringify({
      id,
      stock: parseInt(newStock, 10),
    }),
  });
}

export async function deleteInventoryItem(id) {
  return apiRequest(`/api/inventory?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ==========================================
// === MEMBERS API ===
// ==========================================

export async function fetchMembers() {
  const data = await apiRequest('/api/members');
  return data || [];
}

export async function insertMember(member) {
  return apiRequest('/api/members', {
    method: 'POST',
    body: JSON.stringify({
      id: member.id,
      name: member.name,
      phone: member.phone,
      plan: member.plan || 'Monthly (₱500)',
      status: member.status || 'ACTIVE',
      start_date: member.startDate || getLocalDateString(),
      expires_at: member.expiresAt || addDaysToDate(new Date(), 30),
      photo_url: member.photoUrl || null,
    }),
  });
}

export async function renewMemberPlan(memberId, newExpiresAt) {
  return apiRequest('/api/members', {
    method: 'PUT',
    body: JSON.stringify({
      id: memberId,
      expires_at: newExpiresAt,
      status: 'ACTIVE',
    }),
  });
}

export async function pauseMemberPlan(memberId, pauseStatus) {
  return apiRequest('/api/members', {
    method: 'PUT',
    body: JSON.stringify({
      id: memberId,
      status: pauseStatus,
    }),
  });
}

export async function unpauseMemberPlan(memberId, newExpiresAt) {
  return apiRequest('/api/members', {
    method: 'PUT',
    body: JSON.stringify({
      id: memberId,
      expires_at: newExpiresAt,
      status: 'ACTIVE',
    }),
  });
}

export async function updateMemberExpiration(memberId, newExpiresAt) {
  return apiRequest('/api/members', {
    method: 'PUT',
    body: JSON.stringify({
      id: memberId,
      expires_at: newExpiresAt,
      status: 'ACTIVE',
    }),
  });
}

export async function updateMemberPhoto(memberId, photoUrl) {
  return apiRequest('/api/members', {
    method: 'PUT',
    body: JSON.stringify({
      id: memberId,
      photo_url: photoUrl,
    }),
  });
}

export async function deleteMember(id) {
  return apiRequest(`/api/members?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ==========================================
// === DAY PASSERS API ===
// ==========================================

export async function fetchDayPassers() {
  const data = await apiRequest('/api/daypassers');
  return data || [];
}

export async function insertDayPasser(passer) {
  return apiRequest('/api/daypassers', {
    method: 'POST',
    body: JSON.stringify({
      id: passer.id,
      name: passer.name,
      status: passer.status || 'ACTIVE',
      raw_date: passer.rawDate,
      date: passer.date,
      time: passer.time,
    }),
  });
}

export async function deleteDayPasser(id) {
  return apiRequest(`/api/daypassers?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ==========================================
// === TRANSACTIONS API ===
// ==========================================

export async function fetchTransactions() {
  const data = await apiRequest('/api/transactions');
  return data || [];
}

export async function insertTransaction(transaction) {
  return apiRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({
      transactionId: transaction.transactionId,
      customerId: transaction.customerId,
      customerType: transaction.customerType,
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      items: transaction.items,
      date: transaction.date,
      time: transaction.time,
      paidDate: transaction.paidDate || null,
      paidTime: transaction.paidTime || null,
      wasUnpaid: transaction.wasUnpaid || transaction.status === 'UNPAID',
    }),
  });
}

export async function updateTransactionToPaid(transactionId, { paidDate, paidTime }) {
  return apiRequest('/api/transactions', {
    method: 'PUT',
    body: JSON.stringify({
      transactionId,
      paidDate,
      paidTime,
    }),
  });
}

// ==========================================
// === REALTIME / AUTO-SYNC ===
// ==========================================

export function subscribeToRealtimeChanges(onDataChange) {
  // Synchronize periodically across devices/tabs (every 10 seconds)
  const intervalId = setInterval(() => {
    onDataChange('members');
    onDataChange('inventory');
    onDataChange('day_passers');
    onDataChange('transactions');
  }, 10000);

  // Also sync when browser tab regains focus
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      onDataChange('members');
      onDataChange('inventory');
      onDataChange('day_passers');
      onDataChange('transactions');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

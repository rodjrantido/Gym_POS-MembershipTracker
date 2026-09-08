import { supabase } from '../supabase';
import { getLocalDateString, addDaysToDate } from '../utils/dateUtils';

// ==========================================
// === AUTHENTICATION API ===
// ==========================================

export async function authenticateStaff(username, password) {
  const cleanUsername = username?.trim() || '';
  const cleanPassword = password?.trim() || '';

  console.log('[Auth] Attempting login with username:', cleanUsername);

  const { data, error } = await supabase
    .from('staff_accounts')
    .select('*')
    .ilike('username', cleanUsername)
    .eq('password', cleanPassword)
    .maybeSingle();

  console.log('[Auth] Supabase response:', { data, error });

  if (error) {
    console.error('[Auth] Database error:', error);
    throw new Error(error.message || 'Database connection error');
  }

  if (!data) {
    // Diagnostic check: test if table has any accounts or if RLS is blocking
    const { data: allAccounts, error: checkError } = await supabase
      .from('staff_accounts')
      .select('username')
      .limit(5);

    console.log('[Auth] Visible accounts in DB:', allAccounts, 'Check error:', checkError);

    if (!allAccounts || allAccounts.length === 0) {
      throw new Error('No accounts found in staff_accounts. Make sure RLS is disabled or policy is added.');
    }

    throw new Error('Invalid username or password');
  }

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

  // Sanitize memberId (remove '#' or special characters that break S3/Supabase storage)
  const cleanId = String(memberId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `photo_${cleanId}_${Date.now()}.${fileExt}`;

  // 1. Try uploading to Supabase Storage bucket
  try {
    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicData } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        console.log('[Storage] Photo uploaded successfully to bucket:', publicData.publicUrl);
        return publicData.publicUrl;
      }
    } else {
      console.warn('[Storage] Bucket upload warning, falling back to permanent base64:', uploadError);
    }
  } catch (err) {
    console.warn('[Storage] Exception during bucket upload, falling back to permanent base64:', err);
  }

  // 2. Fallback: Compress and store permanently as Base64 in database
  const base64Url = await compressImageToBase64(file);
  console.log('[Storage] Saved photo permanently as base64 database record');
  return base64Url;
}


// ==========================================
// === INVENTORY API ===
// ==========================================

export async function fetchInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
  return data || [];
}

export async function insertInventoryItem(item) {
  const { data, error } = await supabase
    .from('inventory')
    .insert([
      {
        id: item.id,
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        stock: parseInt(item.stock, 10),
        threshold: parseInt(item.threshold, 10),
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
  return data;
}

export async function updateItemStock(id, newStock) {
  const { data, error } = await supabase
    .from('inventory')
    .update({ stock: parseInt(newStock, 10) })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
  return data;
}

export async function deleteInventoryItem(id) {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}

// ==========================================
// === MEMBERS API ===
// ==========================================

export async function fetchMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
  return data || [];
}

export async function insertMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert([
      {
        id: member.id,
        name: member.name,
        phone: member.phone,
        plan: member.plan || 'Monthly (₱500)',
        status: member.status || 'ACTIVE',
        start_date: member.startDate || getLocalDateString(),
        expires_at: member.expiresAt || addDaysToDate(new Date(), 30),
        photo_url: member.photoUrl || null,
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error adding member:', error);
    throw error;
  }
  return data;
}

export async function renewMemberPlan(memberId, newExpiresAt) {
  const { data, error } = await supabase
    .from('members')
    .update({
      expires_at: newExpiresAt,
      status: 'ACTIVE',
    })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error renewing member plan:', error);
    throw error;
  }
  return data;
}

export async function updateMemberExpiration(memberId, newExpiresAt) {
  const { data, error } = await supabase
    .from('members')
    .update({
      expires_at: newExpiresAt,
      status: 'ACTIVE',
    })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating member expiration:', error);
    throw error;
  }
  return data;
}


export async function updateMemberPhoto(memberId, photoUrl) {
  const { data, error } = await supabase
    .from('members')
    .update({ photo_url: photoUrl })
    .eq('id', memberId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating member photo:', error);
    throw error;
  }
  return data;
}

export async function deleteMember(id) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}

// ==========================================
// === DAY PASSERS API ===
// ==========================================

export async function fetchDayPassers() {
  const { data, error } = await supabase
    .from('day_passers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching day passers:', error);
    throw error;
  }
  return data || [];
}

export async function insertDayPasser(passer) {
  const { data, error } = await supabase
    .from('day_passers')
    .insert([
      {
        id: passer.id,
        name: passer.name,
        status: passer.status || 'ACTIVE',
        raw_date: passer.rawDate,
        date: passer.date,
        time: passer.time,
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error adding day passer:', error);
    throw error;
  }
  return data;
}

export async function deleteDayPasser(id) {
  const { error } = await supabase
    .from('day_passers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting day passer:', error);
    throw error;
  }
}

// ==========================================
// === TRANSACTIONS API ===
// ==========================================

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
  return data || [];
}

export async function insertTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        transaction_id: transaction.transactionId,
        customer_id: transaction.customerId,
        customer_type: transaction.customerType,
        total_amount: transaction.totalAmount,
        status: transaction.status,
        items: transaction.items,
        date: transaction.date,
        time: transaction.time,
        paid_date: transaction.paidDate || null,
        paid_time: transaction.paidTime || null,
        was_unpaid: transaction.wasUnpaid || transaction.status === 'UNPAID',
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
  return data;
}

export async function updateTransactionToPaid(transactionId, { paidDate, paidTime }) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      status: 'PAID',
      paid_date: paidDate,
      paid_time: paidTime,
      was_unpaid: true,
    })
    .eq('transaction_id', transactionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating transaction payment:', error);
    throw error;
  }
  return data;
}

// ==========================================
// === REALTIME SUBSCRIPTIONS ===
// ==========================================

export function subscribeToRealtimeChanges(onDataChange) {
  const channel = supabase
    .channel('gym-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'members' },
      () => onDataChange('members')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      () => onDataChange('inventory')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'day_passers' },
      () => onDataChange('day_passers')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      () => onDataChange('transactions')
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

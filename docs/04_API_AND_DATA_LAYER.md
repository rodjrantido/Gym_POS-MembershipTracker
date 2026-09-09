# 🔌 STEP 4: Writing API Connections (`api.js`)

Never write raw database queries directly inside your UI buttons or screens. Instead, write dedicated asynchronous functions in `src/services/api.js`.

---

## 1. The CRUD Pattern (Create, Read, Update, Delete)

Every table in your application follows the exact same 4 patterns:

```javascript
import { supabase } from "../supabase";

// ===================================================
// 1. READ (Fetch all rows, ordered)
// ===================================================
export async function fetchMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
  return data || [];
}

// ===================================================
// 2. CREATE (Insert a new row)
// ===================================================
export async function insertMember(member) {
  const { data, error } = await supabase
    .from("members")
    .insert([
      {
        id: member.id,
        name: member.name,
        phone: member.phone,
        plan: member.plan,
        status: member.status || "ACTIVE",
        start_date: member.startDate,
        expires_at: member.expiresAt,
        photo_url: member.photoUrl || null,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error inserting member:", error);
    throw error;
  }
  return data;
}

// ===================================================
// 3. UPDATE (Modify an existing row by ID)
// ===================================================
export async function updateItemStock(itemId, newStock) {
  const { data, error } = await supabase
    .from("inventory")
    .update({ stock: newStock })
    .eq("id", itemId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
  return data;
}

// ===================================================
// 4. DELETE (Remove a row by ID)
// ===================================================
export async function deleteMember(memberId) {
  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    console.error("Error deleting member:", error);
    throw error;
  }
}
```

---

## 2. `.maybeSingle()` vs `.single()`: A Crucial Distinction

When querying for a single item (like finding a user by username, or after an update):

- **`.single()`**: Throws a fatal error if 0 rows match.
- **`.maybeSingle()`**: Returns `null` if 0 rows match without crashing your app.
- **Always prefer `.maybeSingle()`** for logins and lookups!

---

## 3. Case-Insensitive Lookups (`ilike`)

For logins or search bars where capitalization shouldn't matter:

```javascript
export async function authenticateStaff(username, password) {
  const { data, error } = await supabase
    .from("staff_accounts")
    .select("*")
    .ilike("username", username.trim()) // 'ilike' ignores uppercase/lowercase
    .eq("password", password.trim())
    .maybeSingle();

  if (error) throw error;
  return data; // returns staff object if found, or null if incorrect
}
```

---

## 4. Handling Photos (Storage Bucket + Base64 Fallback)

To ensure member photos never fail even if storage permissions are misconfigured:

```javascript
// Compress photo to lightweight Base64 string (~30KB)
export async function compressImageToBase64(file, maxWidth = 350) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

---

## 5. Setting Up Realtime Multi-Device Sync

Listen for database changes anywhere and trigger a state update:

```javascript
export function subscribeToRealtimeChanges(onTableChange) {
  const channel = supabase
    .channel("schema-db-changes")
    .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
      console.log("Realtime change detected:", payload.table);
      onTableChange(payload.table);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

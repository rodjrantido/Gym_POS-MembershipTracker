# ⚛️ STEP 5: Writing React & JSX Code

JSX lets you write HTML-like elements directly inside JavaScript functions. Here is how modern React works in simple terms.

---

## 1. The 3 Core Concepts: Component, Props, and State

### A. Component (A Reusable Function)
A component is just a JavaScript function that returns JSX (HTML):

```jsx
export const Header = ({ title, subtitle, onBack }) => {
  return (
    <div className="flex justify-between items-center p-4 bg-zinc-950">
      {onBack && (
        <button onClick={onBack} className="text-zinc-400 hover:text-white">
          Back
        </button>
      )}
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
};
```

---

### B. Props (Passing Data Down to Children)
Props are like function arguments. The parent provides them, and the child displays them:

```jsx
// Parent renders:
<Header title="MEMBERS LIST" subtitle="50 Active Members" onBack={goHome} />
```

---

### C. State (`useState` - Memory of a Component)
State holds variables that can change over time. When state updates, React automatically re-renders the screen:

```jsx
import { useState } from 'react';

export const Counter = () => {
  // 1. Declare state: [currentValue, updateFunction] = useState(initialValue)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Current count: {count}</p>
      <button onClick={() => setCount(prev => prev + 1)}>
        Add +1
      </button>
    </div>
  );
};
```

---

## 2. The Cardinal Rule of React Hooks

> ⚠️ **CRITICAL RULE**: All `useState`, `useEffect`, and custom hooks **MUST** be called at the very top of your component function, before any conditional statements or `return` statements!

### ❌ WRONG (Crashes your app):
```jsx
export const MemberDetail = ({ member }) => {
  if (!member) return null; // ❌ Early return before hook!

  const [days, setDays] = useState(30); // 💥 Crashes React!
  return <div>{member.name}</div>;
};
```

### ✅ CORRECT:
```jsx
export const MemberDetail = ({ member }) => {
  // 1. All hooks at the top:
  const [days, setDays] = useState(30);

  // 2. Early returns go AFTER all hooks:
  if (!member) return null;

  return <div>{member.name}</div>;
};
```

---

## 3. Handling User Input & Forms

Always use **controlled inputs** (inputs bound to state):

```jsx
export const AddForm = ({ onSave }) => {
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
      />
      <button type="submit" className="w-full py-3 bg-[#d4ff00] text-black font-bold rounded-xl">
        Save
      </button>
    </form>
  );
};
```

---

## 4. Conditional Rendering & Lists (`.map()`)

### Conditional Rendering:
```jsx
// Show only if condition is true:
{isPaused && <p className="text-blue-400">Membership is on hold</p>}

// If-Else ternary operator:
{isExpired ? (
  <span className="text-red-400">Expired</span>
) : (
  <span className="text-[#d4ff00]">Active</span>
)}
```

### Rendering a List (Always include `key`!):
```jsx
<div className="space-y-2">
  {members.map((member) => (
    <div key={member.id} className="p-3 bg-zinc-900 rounded-xl">
      <h4>{member.name}</h4>
      <p>{member.plan}</p>
    </div>
  ))}
</div>
```

---

## 5. Screen Navigation Without External Routers (Simple & Fast)

Instead of complex router libraries, you can manage screens with a clean state machine in `App.jsx`:

```jsx
export const App = () => {
  const [view, setView] = useState({ name: 'home', params: {} });

  const navigate = (name, params = {}) => {
    setView({ name, params });
    window.scrollTo(0, 0);
  };

  return (
    <main>
      {view.name === 'home' && <DashboardScreen navigate={navigate} />}
      {view.name === 'members' && <MembersScreen navigate={navigate} />}
      {view.name === 'member_detail' && (
        <MemberDetailScreen member={view.params.member} navigate={navigate} />
      )}
    </main>
  );
};
```

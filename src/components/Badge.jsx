export const Badge = ({ status }) => {
  const styles = {
    'ACTIVE': 'bg-[#d4ff00]/10 text-[#d4ff00] border border-[#d4ff00]/20',
    'EXPIRING SOON': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    'EXPIRED': 'bg-red-500/10 text-red-500 border border-red-500/20',
    'PAID': 'text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/20',
    'UNPAID': 'text-red-500 bg-red-500/10 border border-red-500/20',
    'STABLE': 'text-[#d4ff00] border border-[#d4ff00]/20',
    'LOW': 'text-orange-400 border border-orange-400/20',
    'ZERO STOCK': 'text-red-500 border border-red-500/20'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[status] || 'text-zinc-400 border border-zinc-700'}`}>
      {status}
    </span>
  );
};

export default Badge;

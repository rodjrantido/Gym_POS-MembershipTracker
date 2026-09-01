export const Input = ({ icon: Icon, label, type = 'text', ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />}
      <input 
        type={type}
        className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-xl ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#d4ff00] focus:ring-1 focus:ring-[#d4ff00] transition-all`}
        {...props}
      />
    </div>
  </div>
);

export default Input;

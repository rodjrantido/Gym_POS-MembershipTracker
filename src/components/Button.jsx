export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "font-bold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  const variants = {
    primary: "bg-[#d4ff00] text-black hover:bg-[#bce600]",
    secondary: "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    outline: "bg-transparent text-[#d4ff00] border border-[#d4ff00] hover:bg-[#d4ff00]/10"
  };
  return (
    <button 
      className={`${base} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

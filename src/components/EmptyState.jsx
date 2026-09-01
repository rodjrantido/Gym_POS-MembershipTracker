export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-sm font-bold text-zinc-300 mb-1">{title}</h3>
    <p className="text-xs text-zinc-600 max-w-[250px]">{description}</p>
  </div>
);

export default EmptyState;

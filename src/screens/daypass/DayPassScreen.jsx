import { useState } from 'react';
import { Plus, Search, Calendar, UserPlus, Ticket } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

import { getLocalDateString } from '../../utils/dateUtils';

export const DayPassScreen = ({ dayPassers, navigate }) => {
  const [search, setSearch] = useState('');
  const today = getLocalDateString();
  const [filterDate, setFilterDate] = useState(today);
  
  const filteredPassers = dayPassers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const passerLocalDate = p.rawDate || (p.date ? getLocalDateString(p.date) : '');
    const matchesDate = !filterDate || passerLocalDate === filterDate;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24">
      <Header 
        title="DAY PASS LIST" 
        subtitle="Manage Visitors" 
        rightAction={
          <Button onClick={() => navigate('add_daypass')} className="py-2 px-3 text-sm">
            <Plus className="w-4 h-4" /> ADD
          </Button>
        }
      />
      <div className="p-4 space-y-4">
        <Input 
          icon={Search} 
          placeholder="Search day passers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="space-y-2 w-full">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Filter by Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-[#d4ff00] focus:ring-1 focus:ring-[#d4ff00] transition-all [color-scheme:dark]"
              />
            </div>
        </div>

        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Results</span>
          <span className="text-xs font-bold text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-1 rounded-full">{filteredPassers.length} Total</span>
        </div>
        
        <div className="space-y-3 mt-2">
          {filteredPassers.length === 0 ? (
            <EmptyState icon={Ticket} title="No Visitors Found" description="No day passes match your search or date filter." />
          ) : (
            filteredPassers.map(passer => (
              <div 
                key={passer.id} 
                onClick={() => navigate('daypass_detail', { passer })}
                className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center cursor-pointer ${THEME.cardHover}`}
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400">
                      <UserPlus className="w-5 h-5" />
                   </div>
                   <div>
                    <h3 className="font-bold text-sm text-zinc-100">{passer.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{passer.date} • {passer.time}</p>
                   </div>
                </div>
                <Badge status={passer.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DayPassScreen;

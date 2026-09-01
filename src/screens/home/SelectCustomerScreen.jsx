import { useState } from 'react';
import { Search } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Badge from '../../components/Badge';

export const SelectCustomerScreen = ({ members, dayPassers, navigate, onSelect }) => {
  const [tab, setTab] = useState('members');
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const filteredDayPassers = dayPassers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-24 min-h-screen bg-zinc-950">
      <Header onBack={() => navigate('home')} title="SELECT CUSTOMER" subtitle="POINT OF SALE" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setTab('members')}
            className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${tab === 'members' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400'}`}
          >
            Members
          </button>
          <button 
            onClick={() => setTab('daypass')}
            className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${tab === 'daypass' ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400'}`}
          >
            Day Passers
          </button>
        </div>

        <Input 
          icon={Search} 
          placeholder={`Search ${tab === 'members' ? 'members' : 'day passers'}...`} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />

        <div className="space-y-2">
          {tab === 'members' ? (
            filteredMembers.map(member => (
              <div 
                key={member.id} 
                onClick={() => { onSelect({ ...member, type: 'MEMBER' }); navigate('home'); }}
                className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-[#d4ff00]/40`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                    {member.photoUrl || member.photo_url ? (
                      <img src={member.photoUrl || member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.name.substring(0,2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{member.name}</h4>
                    <p className="text-xs text-zinc-500">{member.plan}</p>
                  </div>
                </div>
                <Badge status={member.status} />
              </div>
            ))
          ) : (
            filteredDayPassers.map(passer => (
              <div 
                key={passer.id} 
                onClick={() => { onSelect({ ...passer, type: 'DAY PASS' }); navigate('home'); }}
                className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-[#d4ff00]/40`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs">
                    {passer.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{passer.name}</h4>
                    <p className="text-xs text-zinc-500">Day Pass • {passer.time}</p>
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

export default SelectCustomerScreen;

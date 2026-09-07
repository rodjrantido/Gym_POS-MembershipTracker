import { useState } from 'react';
import { Plus, Search, Users, AlertTriangle } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export const MembersScreen = ({ members, navigate }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, EXPIRING SOON, EXPIRED

  // Helper to compute member status based on current date and expiresAt
  const getMemberComputedStatus = (member) => {
    if (!member.expiresAt && !member.expires_at) return member.status || 'ACTIVE';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(member.expiresAt || member.expires_at);
    const diffTime = expiryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return 'EXPIRED';
    if (daysRemaining <= 5) return 'EXPIRING SOON';
    return 'ACTIVE';
  };

  const filteredMembers = members.filter(m => {
    const computedStatus = getMemberComputedStatus(m);
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || computedStatus === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24">
      <Header 
        title="MEMBERS LIST" 
        subtitle="Manage Active Members" 
        rightAction={
          <Button onClick={() => navigate('add_member')} className="py-2 px-3 text-sm">
            <Plus className="w-4 h-4" /> ADD
          </Button>
        }
      />
      
      <div className="p-4 space-y-4">
        <Input 
          icon={Search} 
          placeholder="Search by name or ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Status Filter Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-bold uppercase">
          {['ALL', 'ACTIVE', 'EXPIRING SOON', 'EXPIRED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`py-2 px-1 rounded-lg transition-all text-center truncate ${filter === f ? 'bg-[#d4ff00] text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {f === 'EXPIRING SOON' ? 'SOON' : f}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Results</span>
          <span className="text-xs font-bold text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-1 rounded-full">
            {filteredMembers.length} Members
          </span>
        </div>
        
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <EmptyState 
              icon={Users} 
              title="No Members Found" 
              description={search ? "No members match your search criteria." : "No members under this filter category."} 
            />
          ) : (
            filteredMembers.map(member => {
              const status = getMemberComputedStatus(member);
              const expiryFormatted = (member.expiresAt || member.expires_at) 
                ? new Date(member.expiresAt || member.expires_at).toLocaleDateString() 
                : null;

              return (
                <div 
                  key={member.id} 
                  onClick={() => navigate('member_detail', { member })}
                  className={`${THEME.card} border ${THEME.border} rounded-xl p-4 flex justify-between items-center cursor-pointer ${THEME.cardHover}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm border border-zinc-700 overflow-hidden shadow-inner shrink-0">
                      {member.photoUrl || member.photo_url ? (
                        <img 
                          src={member.photoUrl || member.photo_url} 
                          alt={member.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-zinc-400">{member.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                        {member.name}
                        {status === 'EXPIRING SOON' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{member.plan}</p>
                      {expiryFormatted && (
                        <p className="text-[10px] text-zinc-500 font-mono">Expires: {expiryFormatted}</p>
                      )}
                    </div>
                  </div>
                  <Badge status={status} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersScreen;

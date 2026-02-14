import React from 'react';
import { Community } from '../../types';
import { Users, ArrowRight } from 'lucide-react';

interface CommunitySectionProps {
  communities: Community[];
}

const CommunitySection: React.FC<CommunitySectionProps> = ({ communities }) => {
  return (
    <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-bold uppercase italic tracking-tighter">Communities</h3>
            <span className="text-[9px] text-white/30 uppercase tracking-[2px] font-black">Discover More</span>
        </div>

        <div className="space-y-4 px-1">
            {communities.map(comm => (
                <div key={comm.id} className="relative h-44 rounded-[2.5rem] overflow-hidden group cursor-pointer active:scale-[0.98] transition-all border border-white/5">
                    <img src={comm.image} alt={comm.name} className="w-full h-full object-cover brightness-[0.5] group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                        <div className="flex items-end justify-between">
                            <div className="max-w-[70%]">
                                <h4 className="text-xl sm:text-2xl font-black mb-1 truncate leading-tight uppercase italic">{comm.name}</h4>
                                <div className="flex items-center space-x-2 text-white/50">
                                    <Users size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{(comm.members / 1000).toFixed(1)}K active</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white/80 group-hover:bg-white group-hover:text-black transition-colors">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
};

export default CommunitySection;
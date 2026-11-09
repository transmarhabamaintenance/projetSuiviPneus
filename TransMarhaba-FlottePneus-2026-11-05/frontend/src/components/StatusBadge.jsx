import React from 'react';

export default function StatusBadge({ statut }) {
  switch (statut) {
    case 'NEUF':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e4efe6] text-[#2c5236] font-label-caps text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A58]"></span>
          Neuf
        </span>
      );
    case 'EN_SERVICE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e4efe6] text-[#2c5236] font-label-caps text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A58]"></span>
          En service
        </span>
      );
    case 'A_REMPLACER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faefdb] text-[#996320] font-label-caps text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C88A3A]"></span>
          À remplacer
        </span>
      );
    case 'EXPIRE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-primary-container font-label-caps text-[10px] font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
          Expiré
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px] font-bold tracking-wider">
          {statut || 'Inconnu'}
        </span>
      );
  }
}

import React from 'react';

export default function ProgressBar({ pourcentage = 0, kmRestant = null, max = null }) {
  const pct = Math.min(Math.max(Number(pourcentage) || 0, 0), 100);

  // Détermination de la couleur selon la règle métier
  let barColor = 'bg-[#4E7A58]';
  let textColor = 'text-[#2c5236]';

  if (pct >= 100) {
    barColor = 'bg-primary-container';
    textColor = 'text-primary-container';
  } else if (pct >= 90) {
    barColor = 'bg-[#C88A3A]';
    textColor = 'text-[#996320]';
  }

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-on-surface-variant">
        <span>Usure : <strong className="text-on-surface font-semibold">{pct.toFixed(1)}%</strong></span>
        {kmRestant !== null && (
          <span className={`font-bold ${textColor}`}>
            Reste {Number(kmRestant).toLocaleString('fr-FR')} km
          </span>
        )}
      </div>
      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

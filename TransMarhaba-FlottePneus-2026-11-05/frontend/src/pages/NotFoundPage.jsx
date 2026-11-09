import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-24 px-4 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary-container mb-4">
        <span className="material-symbols-outlined text-[36px]">error_outline</span>
      </div>
      <h1 className="font-headline-lg font-serif text-5xl font-black text-on-surface mb-2">404</h1>
      <p className="font-title-md text-base text-on-surface-variant mb-6">Page ou ressource introuvable au registre.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Retourner au tableau de bord
      </Link>
    </div>
  );
}

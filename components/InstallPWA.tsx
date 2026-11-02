import React from 'react';

interface InstallPWAProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallPWA: React.FC<InstallPWAProps> = ({ onInstall, onDismiss }) => {
  return (
    <div 
      className="fixed bottom-4 right-4 bg-base-300 p-4 rounded-lg shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 z-50 animate-fade-in-up"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="flex-grow">
        <h3 id="pwa-install-title" className="font-semibold text-text-primary">Installa l'app!</h3>
        <p id="pwa-install-description" className="text-sm text-text-secondary mt-1">
          Aggiungila alla tua schermata home per un'esperienza migliore e accesso offline.
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={onInstall}
          className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
        >
          Installa
        </button>
        <button
          onClick={onDismiss}
          className="text-text-secondary hover:text-text-primary transition-colors font-bold py-2 px-2"
          aria-label="Chiudi"
        >
          Più tardi
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default InstallPWA;

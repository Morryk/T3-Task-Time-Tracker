import React, { useState, useEffect, useRef } from 'react';

interface SessionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const SessionNameModal: React.FC<SessionNameModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [sessionName, setSessionName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSessionName('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(sessionName.trim());
  };

  const handleSkip = () => {
    onSubmit(''); // Submit with an empty name
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-base-200 p-6 rounded-lg shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold text-text-primary mb-4">Dai un nome alla sessione</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Es: Implementazione feature"
            className="w-full bg-base-100 border border-base-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow mb-4"
            aria-label="Nome sessione"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="bg-base-300 hover:bg-gray-500 text-text-primary font-bold py-2 px-4 rounded-md transition-colors"
            >
              Salta
            </button>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Salva Sessione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionNameModal;

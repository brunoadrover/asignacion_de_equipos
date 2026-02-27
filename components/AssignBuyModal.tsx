
import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { EquipmentRequest } from '../types';

interface AssignBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  request: EquipmentRequest | null;
}

export const AssignBuyModal: React.FC<AssignBuyModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  request 
}) => {
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (isOpen && request) {
        setComments(request.comments || '');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-red-600" size={20} />
                Confirmar Gestión de Compra
            </h3>
             <p className="text-sm text-slate-500">
                Se iniciará el proceso de adquisición
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
           <div className="max-w-[70%]">
             <p className="text-sm text-red-800 font-medium truncate">{request.description}</p>
             <p className="text-xs text-red-600">Cantidad: {request.quantity} unidades</p>
          </div>
          <div className="text-right">
              <span className="text-xs font-bold uppercase text-red-600 block">Estado</span>
              <span className="text-sm font-bold text-red-800">COMPRA</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Comentarios de la Solicitud</label>
                <textarea 
                    autoFocus
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-3 text-sm bg-white text-slate-900 h-32"
                    placeholder="Agregue o edite comentarios para la gestión de compra..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                />
            </div>
            
            <div className="flex items-start gap-3 text-slate-500 text-xs italic">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p>Al confirmar, el registro pasará a la lista de "Gestión de Compra" para su seguimiento.</p>
            </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
                type="button" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => onConfirm(comments)}
            >
                Confirmar Gestión de Compra
            </Button>
        </div>
      </div>
    </div>
  );
};

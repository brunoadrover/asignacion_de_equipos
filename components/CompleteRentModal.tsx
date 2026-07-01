import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Save } from 'lucide-react';
import { Button } from './Button';
import { EquipmentRequest } from '../types';
import { supabase } from '../lib/supabase';

interface CompleteRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    nro_interno: string;
    marca: string;
    modelo: string;
    horas_arrastre: number;
    familia: string;
  }) => Promise<void>;
  request: EquipmentRequest | null;
}

export const CompleteRentModal: React.FC<CompleteRentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  request
}) => {
  const [internalId, setInternalId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [hours, setHours] = useState<number>(0);
  const [family, setFamily] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      setInternalId('');
      setBrand('');
      setModel('');
      setHours(0);
      // Prefill "familia" with request.capacity as instructed ("capacidad" contains the "familia" value)
      setFamily(request.capacity || '');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalId.trim() || !brand.trim() || !model.trim() || !family.trim()) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({
        nro_interno: internalId.trim().toUpperCase(),
        marca: brand.trim().toUpperCase(),
        modelo: model.trim().toUpperCase(),
        horas_arrastre: Number(hours),
        familia: family.trim()
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar el equipo: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Completar Alquiler de Equipo
            </h3>
            <p className="text-xs text-slate-500">
              Registre el equipo alquilado para asignarle número interno e ingresarlo a obra.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <p className="text-xs font-bold uppercase text-amber-600 mb-0.5">Solicitud Asociada</p>
          <p className="text-sm font-medium text-slate-800">{request.description}</p>
          {request.comments && (
            <p className="text-xs italic text-slate-500 mt-1">"{request.comments}"</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Número de Interno *
              </label>
              <input
                required
                autoFocus
                type="text"
                placeholder="Ej: Q0555"
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm bg-white text-slate-900"
                value={internalId}
                onChange={(e) => setInternalId(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Marca *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Komatsu"
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm bg-white text-slate-900"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Modelo *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: PC240-8"
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm bg-white text-slate-900"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hs de Arrastre
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 0"
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm bg-white text-slate-900"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Familia *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Familia del equipo"
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm bg-white text-slate-900"
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Guardando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" /> Guardar y Completar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

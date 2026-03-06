import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { EquipmentRequest, RequestStatus, UnidadOperativa, Categoria, UserRole, MaestroEquipo } from '../types';

interface RequestFormProps {
  onSubmit: (req: any) => void;
  uos: UnidadOperativa[];
  maestroEquipos: MaestroEquipo[];
  currentUser: { rol: UserRole; uo_id?: string } | null;
}

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, uos, maestroEquipos, currentUser }) => {
  const [formData, setFormData] = useState({
    uo_id: '',
    description: '',
    capacity: '',
    quantity: 1,
    usagePeriod: '' as number | '',
    needDate: '',
    comments: ''
  });

  const [isDescOpen, setIsDescOpen] = useState(false);
  const [descSearch, setDescSearch] = useState('');
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (descRef.current && !descRef.current.contains(event.target as Node)) {
        setIsDescOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser?.rol === UserRole.USER && currentUser.uo_id) {
      setFormData(prev => ({ ...prev, uo_id: currentUser.uo_id || '' }));
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequestData = {
      requestDate: new Date().toISOString().split('T')[0],
      ...formData
    };
    onSubmit(newRequestData);
    setFormData({ 
      uo_id: currentUser?.rol === UserRole.USER ? (currentUser.uo_id || '') : '', 
      description: '', 
      capacity: '', 
      quantity: 1, 
      usagePeriod: '' as number | '',
      needDate: '', 
      comments: '' 
    });
    setDescSearch('');
  };

  const handleDescriptionSelect = (m: MaestroEquipo) => {
    setFormData({
      ...formData,
      description: m.descripcion,
      capacity: m.familia
    });
    setDescSearch(m.descripcion);
    setIsDescOpen(false);
  };

  const filteredMaestro = maestroEquipos.filter(m => 
    m.descripcion.toLowerCase().includes(descSearch.toLowerCase())
  );

  const inputClasses = "w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm bg-white text-slate-900 placeholder:text-slate-400";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4 text-slate-800">
        <PlusCircle className="text-blue-600" />
        <h2 className="text-lg font-bold">Nueva Solicitud de Equipo</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidad Operativa (UO)</label>
          <select 
            required 
            disabled={currentUser?.rol === UserRole.USER}
            className={`${inputClasses} ${currentUser?.rol === UserRole.USER ? 'bg-slate-100 cursor-not-allowed' : ''}`} 
            value={formData.uo_id} 
            onChange={(e) => setFormData({...formData, uo_id: e.target.value})}
          >
            <option value="" disabled>Seleccione UO...</option>
            {uos.map((uo) => <option key={uo.id} value={uo.id}>{uo.nombre}</option>)}
          </select>
        </div>

        <div className="relative" ref={descRef}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <div 
            className={`relative flex items-center ${inputClasses} cursor-text`}
            onClick={() => setIsDescOpen(true)}
          >
            <input 
              type="text"
              placeholder="Buscar equipo..."
              className="w-full bg-transparent outline-none border-none p-0 text-sm"
              value={descSearch}
              onChange={(e) => {
                setDescSearch(e.target.value);
                setIsDescOpen(true);
                if (e.target.value === '') {
                  setFormData({...formData, description: '', capacity: ''});
                }
              }}
              required={!formData.description}
            />
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDescOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDescOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredMaestro.length > 0 ? (
                filteredMaestro.map((m) => (
                  <div 
                    key={m.id}
                    className="px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col"
                    onClick={() => handleDescriptionSelect(m)}
                  >
                    <span className="font-medium text-slate-900">{m.descripcion}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{m.familia}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400 italic">No se encontraron resultados</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Familia</label>
          <input 
            type="text" 
            readOnly 
            placeholder="Familia del equipo" 
            className={`${inputClasses} bg-slate-50 cursor-not-allowed font-medium text-blue-800`} 
            value={formData.capacity} 
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
            <input required type="number" min="1" className={inputClasses} value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Necesidad</label>
            <input required type="date" className={inputClasses} value={formData.needDate} onChange={(e) => setFormData({...formData, needDate: e.target.value})} />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Periodo (Meses) <span className="text-red-500">*</span>
            </label>
            <input 
              required 
              type="number" 
              min="0.5" 
              step="0.5" 
              placeholder="Ej: 6" 
              className={`${inputClasses} ${!formData.usagePeriod ? 'border-red-300 bg-red-50' : ''}`} 
              value={formData.usagePeriod} 
              onChange={(e) => setFormData({...formData, usagePeriod: e.target.value ? Number(e.target.value) : ''})} 
            />
            {!formData.usagePeriod && (
              <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
            )}
        </div>

        <div className="lg:col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Comentarios</label>
          <input type="text" placeholder="Detalles adicionales..." className={inputClasses} value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} />
        </div>

        <div className="lg:col-span-4 flex flex-col items-end gap-2">
          {!formData.usagePeriod && (
            <span className="text-xs text-amber-600 font-medium italic">Complete el periodo para habilitar el envío</span>
          )}
          <Button 
            type="submit" 
            disabled={!formData.usagePeriod || !formData.uo_id || !formData.description || !formData.needDate}
          >
            Agregar Solicitud
          </Button>
        </div>
      </form>
    </div>
  );
};
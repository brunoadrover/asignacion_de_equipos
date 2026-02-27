
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Search, Loader2, AlertTriangle, Save } from 'lucide-react';
import { Button } from './Button';
import { EquipmentRequest, OwnDetails } from '../types';
import { supabase } from '../lib/supabase';

interface AssignOwnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (detailsList: OwnDetails[], comments: string) => void;
  request: EquipmentRequest | null;
}

export const AssignOwnModal: React.FC<AssignOwnModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  request 
}) => {
  const [assignedItems, setAssignedItems] = useState<OwnDetails[]>([]);
  const [comments, setComments] = useState('');
  
  // Estados para el flujo de carga
  const [internalIdInput, setInternalIdInput] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [isSavingNew, setIsSavingNew] = useState(false);
  
  // Datos del equipo encontrado o a crear
  const [equipmentData, setEquipmentData] = useState<{
    id?: string;
    brand: string;
    model: string;
    hours: number;
    availabilityDate: string;
  }>({
    brand: '',
    model: '',
    hours: 0,
    availabilityDate: ''
  });

  useEffect(() => {
    if (isOpen && request) {
        setAssignedItems([]);
        setComments(request.comments || '');
        resetForm();
    }
  }, [isOpen, request]);

  const resetForm = () => {
      setInternalIdInput('');
      setSearchStatus('idle');
      setEquipmentData({
          brand: '',
          model: '',
          hours: 0,
          availabilityDate: '' // Podríamos mantener la fecha si el usuario carga masivamente
      });
  };

  const handleSearch = async () => {
      if (internalIdInput.length < 2) return;
      
      setSearchStatus('searching');
      const cleanId = internalIdInput.trim().toUpperCase();

      try {
          const { data, error } = await supabase
              .from('equipos')
              .select('*')
              .eq('nro_interno', cleanId)
              .maybeSingle();
          
          if (error) throw error;

          if (data) {
              setSearchStatus('found');
              setEquipmentData({
                  id: data.id,
                  brand: data.marca,
                  model: data.modelo,
                  hours: data.horas_arrastre || 0,
                  availabilityDate: equipmentData.availabilityDate // Mantener lo que el usuario haya puesto o vacio
              });
          } else {
              setSearchStatus('not_found');
              // Limpiamos datos previos para que cargue los nuevos
              setEquipmentData(prev => ({ ...prev, brand: '', model: '', hours: 0, id: undefined }));
          }
      } catch (err) {
          console.error(err);
          alert("Error de conexión al buscar el equipo.");
          setSearchStatus('idle');
      }
  };

  // Detectar enter en el input de búsqueda
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleSearch();
      }
  };

  const handleCreateAndAdd = async () => {
      if (!internalIdInput || !equipmentData.brand || !equipmentData.model) {
          alert("Por favor complete Marca y Modelo para registrar el equipo.");
          return;
      }

      setIsSavingNew(true);
      try {
          const cleanId = internalIdInput.trim().toUpperCase();
          
          // 1. Crear el equipo en la BD
          // NOTA: No enviamos 'estado' ni 'estado_actual' explícitamente para que la BD use sus defaults.
          // Si la columna 'estado' no existe, enviarla causaba el error.
          const { data: newEquip, error } = await supabase.from('equipos').insert({
              nro_interno: cleanId,
              marca: equipmentData.brand.toUpperCase(),
              modelo: equipmentData.model.toUpperCase(),
              horas_arrastre: equipmentData.hours
          }).select().single();

          if (error) throw error;

          if (!newEquip) throw new Error("No se devolvieron datos tras la creación.");

          // 2. Agregarlo a la lista local usando el ID recién creado
          addToList(newEquip.id, cleanId, newEquip.marca, newEquip.modelo);

      } catch (error: any) {
          console.error("Error creating equipment:", error);
          alert(`Error al crear el equipo: ${error.message}`);
      } finally {
          setIsSavingNew(false);
      }
  };

  const handleAddExisting = () => {
      if (!equipmentData.id) return;
      addToList(equipmentData.id, internalIdInput.toUpperCase(), equipmentData.brand, equipmentData.model);
  };

  const addToList = (id: string, internalId: string, brand: string, model: string) => {
      if (!equipmentData.availabilityDate) {
          alert("Por favor ingrese la Fecha de Disponibilidad.");
          return;
      }

      const newItem: OwnDetails = {
          equipo_id: id,
          internalId: internalId,
          brand: brand,
          model: model,
          hours: equipmentData.hours,
          availabilityDate: equipmentData.availabilityDate
      };

      setAssignedItems([...assignedItems, newItem]);
      
      // Resetear formulario para el siguiente, pero mantener fecha por comodidad
      const prevDate = equipmentData.availabilityDate;
      resetForm();
      setEquipmentData(prev => ({ ...prev, availabilityDate: prevDate }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...assignedItems];
    newItems.splice(index, 1);
    setAssignedItems(newItems);
  };

  if (!isOpen || !request) return null;
  const remainingQty = request.quantity - assignedItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Asignar Equipos Propios</h3>
            <p className="text-sm text-slate-500">Solicitud: {request.quantity} unidades</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        {/* Info Bar */}
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div>
             <p className="text-sm text-blue-800 font-medium">{request.description}</p>
             <p className="text-xs text-blue-600">UO: {request.uo_nombre}</p>
          </div>
          <div className="text-right">
              <span className="text-xs font-bold uppercase text-blue-600 block">Pendientes</span>
              <span className="text-2xl font-bold text-blue-800">{remainingQty}</span>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="px-6 pt-4">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Comentarios de la Solicitud</label>
            <textarea 
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm bg-slate-50 text-slate-900 h-20"
                placeholder="Agregue o edite comentarios..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            
            {/* Left Column: Form */}
            <div className="space-y-4">
                <h4 className="font-medium text-slate-700 border-b pb-2">
                    {remainingQty > 0 ? `Cargar Equipo (${assignedItems.length + 1}/${request.quantity})` : 'Carga Completa'}
                </h4>
                
                {remainingQty > 0 ? (
                <div className="space-y-4">
                    {/* 1. Search Box */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Buscar por N° Interno</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ej: V0986"
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm bg-white text-slate-900 uppercase font-bold"
                                    value={internalIdInput}
                                    onChange={(e) => {
                                        setInternalIdInput(e.target.value.toUpperCase());
                                        if (searchStatus !== 'idle') setSearchStatus('idle'); // Reset status on change
                                    }}
                                    onKeyDown={handleKeyDown}
                                    disabled={searchStatus === 'found' || searchStatus === 'not_found'}
                                />
                                {searchStatus === 'searching' && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-blue-500" /></div>
                                )}
                            </div>
                            {(searchStatus === 'found' || searchStatus === 'not_found') ? (
                                <Button size="sm" variant="secondary" onClick={() => { setSearchStatus('idle'); setInternalIdInput(''); }} title="Limpiar búsqueda">
                                    <X size={16} />
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleSearch} disabled={!internalIdInput}>
                                    <Search size={16} />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 2. Results Area */}
                    {searchStatus === 'found' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-3 bg-emerald-50 p-3 rounded border border-emerald-100">
                             <div className="flex items-center gap-2 text-emerald-800 mb-2">
                                <CheckCircle2 size={16} /> <span className="text-xs font-bold">Equipo Encontrado</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-xs text-slate-500 block">Marca</span>
                                    <span className="font-medium text-slate-800">{equipmentData.brand}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Modelo</span>
                                    <span className="font-medium text-slate-800">{equipmentData.model}</span>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Disponibilidad</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full rounded border-slate-300 border p-1.5 text-sm bg-white text-slate-900 shadow-sm"
                                    value={equipmentData.availabilityDate}
                                    onChange={(e) => setEquipmentData({...equipmentData, availabilityDate: e.target.value})}
                                />
                             </div>
                             <Button onClick={handleAddExisting} className="w-full mt-2" size="sm" variant="success">
                                Agregar a la lista
                             </Button>
                        </div>
                    )}

                    {searchStatus === 'not_found' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-3 bg-amber-50 p-3 rounded border border-amber-100">
                             <div className="flex items-center gap-2 text-amber-800 mb-2 border-b border-amber-200 pb-1">
                                <AlertTriangle size={16} /> <span className="text-xs font-bold">Equipo Nuevo: Registrar datos</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Marca *</label>
                                    <input
                                        type="text"
                                        className="w-full rounded border-slate-300 border p-1.5 text-sm uppercase bg-white text-slate-900 shadow-sm"
                                        value={equipmentData.brand}
                                        onChange={(e) => setEquipmentData({...equipmentData, brand: e.target.value})}
                                        placeholder="TOYOTA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Modelo *</label>
                                    <input
                                        type="text"
                                        className="w-full rounded border-slate-300 border p-1.5 text-sm uppercase bg-white text-slate-900 shadow-sm"
                                        value={equipmentData.model}
                                        onChange={(e) => setEquipmentData({...equipmentData, model: e.target.value})}
                                        placeholder="HILUX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Horas</label>
                                    <input
                                        type="number"
                                        className="w-full rounded border-slate-300 border p-1.5 text-sm bg-white text-slate-900 shadow-sm"
                                        value={equipmentData.hours}
                                        onChange={(e) => setEquipmentData({...equipmentData, hours: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Disponibilidad *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full rounded border-slate-300 border p-1.5 text-sm bg-white text-slate-900 shadow-sm"
                                        value={equipmentData.availabilityDate}
                                        onChange={(e) => setEquipmentData({...equipmentData, availabilityDate: e.target.value})}
                                    />
                                </div>
                             </div>
                             <Button 
                                onClick={handleCreateAndAdd} 
                                className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white" 
                                size="sm"
                                disabled={isSavingNew}
                             >
                                {isSavingNew ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                Guardar y Agregar
                             </Button>
                        </div>
                    )}
                </div>
                ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md flex flex-col items-center justify-center gap-2 py-10 border border-emerald-100">
                        <CheckCircle2 size={32} />
                        <p className="text-sm font-bold">Solicitud Completa</p>
                    </div>
                )}
            </div>

            {/* Right Column: List */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 flex flex-col h-full max-h-[400px]">
                <div className="p-3 border-b border-slate-200 bg-slate-100">
                    <h4 className="font-medium text-slate-700 text-sm">Lista de Asignación ({assignedItems.length})</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {assignedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p>Busque y agregue equipos para comenzar</p>
                        </div>
                    ) : (
                        assignedItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm relative group animate-in zoom-in duration-200">
                                <button 
                                    onClick={() => handleRemoveItem(idx)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-800">#{item.internalId}</span>
                                    <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 rounded">{item.availabilityDate}</span>
                                </div>
                                <div className="text-xs text-slate-600">
                                    {item.brand} {item.model}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
                type="button" 
                variant="success" 
                disabled={assignedItems.length === 0 || searchStatus === 'searching' || isSavingNew}
                onClick={() => onConfirm(assignedItems, comments)}
            >
                Confirmar Asignación ({assignedItems.length})
            </Button>
        </div>
      </div>
    </div>
  );
};

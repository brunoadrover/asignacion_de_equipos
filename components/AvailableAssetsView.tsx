import React, { useState, useMemo } from 'react';
import { Search, Package, CheckCircle, Info, MapPin, Calendar, Clock, FileDown, Trash2 } from 'lucide-react';
import { EquipmentRequest } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './Button';

interface AvailableAssetsViewProps {
  requests: EquipmentRequest[];
  onRefresh?: () => void;
  onRetireEquipment?: (equipoId: string) => Promise<void>;
}

export const AvailableAssetsView: React.FC<AvailableAssetsViewProps> = ({ 
  requests, 
  onRefresh,
  onRetireEquipment
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter requests that represent assignments of own equipment whose equipment's current status is 'Disponible'
  const availableAssignments = useMemo(() => {
    return requests.filter(req => {
      // Must be an OWN assignment (has ownDetails)
      if (!req.ownDetails) return false;
      
      // Must have state 'Disponible'
      return req.ownDetails.estado_actual === 'Disponible';
    });
  }, [requests]);

  // Search filter
  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return availableAssignments;
    const cleanSearch = searchTerm.toLowerCase().trim();
    return availableAssignments.filter(req => {
      const internalId = req.ownDetails?.internalId?.toLowerCase() || '';
      const brand = req.ownDetails?.brand?.toLowerCase() || '';
      const model = req.ownDetails?.model?.toLowerCase() || '';
      const uoName = req.uo_nombre?.toLowerCase() || '';
      const desc = req.description?.toLowerCase() || '';
      
      return internalId.includes(cleanSearch) ||
             brand.includes(cleanSearch) ||
             model.includes(cleanSearch) ||
             uoName.includes(cleanSearch) ||
             desc.includes(cleanSearch);
    });
  }, [availableAssignments, searchTerm]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Group filtered assignments by Obra (uo_nombre)
    const grouped = filteredAssignments.reduce((acc, req) => {
      const key = req.uo_nombre || 'Sin Obra Especificada';
      if (!acc[key]) acc[key] = [];
      acc[key].push(req);
      return acc;
    }, {} as Record<string, EquipmentRequest[]>);

    // Title / Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(27, 77, 62); // Emerald color #1B4D3E
    doc.text("Reporte de Activos a Disposición", 14, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${dateStr}`, 14, 26);
    doc.text(`Cantidad de activos: ${filteredAssignments.length}`, 14, 31);
    
    // Horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 35, 196, 35);
    
    let yPos = 42;
    
    (Object.entries(grouped) as [string, EquipmentRequest[]][]).forEach(([obra, items]) => {
      // Check for page overflow
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      // Obra Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(`Obra: ${obra}`, 14, yPos);
      yPos += 4;
      
      const head = [['N° Interno', 'Equipo (Marca/Modelo)', 'Descripción Requerimiento', 'Horas', 'Fecha Fin Obra']];
      const body = items.map(req => [
        `#${req.ownDetails?.internalId || '-'}`,
        `${req.ownDetails?.brand || '-'} ${req.ownDetails?.model || '-'}`,
        req.description || '-',
        req.ownDetails?.hours !== undefined ? `${Number(req.ownDetails.hours).toLocaleString()} hs` : '0 hs',
        req.ownDetails?.availabilityDate || '-'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [27, 77, 62] }, // Emerald
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 12;
    });
    
    doc.save(`Activos_a_Disposicion_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Stats card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-[#1B4D3E]" size={24} />
            Activos a Disposición
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Asignaciones de equipos propios a UO que se encuentran disponibles para nuevos proyectos.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#EAF2EE] px-4 py-2.5 rounded-lg border border-[#D5E5DD]">
          <CheckCircle className="text-[#1B4D3E]" size={20} />
          <div>
            <span className="text-[11px] font-bold text-[#1B4D3E]/80 uppercase block tracking-wider leading-none">Equipos Disponibles</span>
            <span className="text-xl font-bold text-[#1B4D3E] font-mono">{availableAssignments.length}</span>
          </div>
        </div>
      </div>

      {/* Search Input & Export Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Filtrar por N° Interno, Marca, Modelo, Obra, Solicitud..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 focus:border-[#1B4D3E] text-sm bg-white text-slate-800 placeholder-slate-400 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={exportToPDF} 
          variant="outline" 
          size="md" 
          className="flex items-center gap-2 py-3 border-[#D5E5DD] hover:bg-[#EAF2EE] hover:text-[#1B4D3E] text-slate-700 font-semibold shadow-sm shrink-0 whitespace-nowrap cursor-pointer transition-colors"
        >
          <FileDown size={18} /> Exportar PDF por Obra
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4 font-semibold">N° Interno</th>
                <th className="px-6 py-4 font-semibold">Equipo</th>
                <th className="px-6 py-4 font-semibold">Obra de Origen / Requerimiento</th>
                <th className="px-6 py-4 font-semibold text-right">Horas</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info size={28} className="opacity-40 text-slate-400" />
                      <p className="font-medium">No se encontraron activos a disposición</p>
                      <p className="text-xs text-slate-400">
                        Los equipos que se pasan a Disponible desde la vista "Activos en Obra" aparecerán aquí.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#1B4D3E]">
                      #{req.ownDetails?.internalId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 uppercase">
                        {req.ownDetails?.brand}
                      </div>
                      <div className="text-xs text-slate-500 uppercase">
                        {req.ownDetails?.model}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <MapPin size={14} className="text-slate-400" />
                        {req.uo_nombre}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-normal">
                        {req.description} {req.capacity ? `(${req.capacity})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Clock size={13} className="text-slate-400" />
                        <span>{req.ownDetails?.hours !== undefined ? Number(req.ownDetails.hours).toLocaleString() : '0'} hs</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        Fin: {req.ownDetails?.availabilityDate || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Disponible
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.ownDetails?.equipo_id ? (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Está seguro de que desea retirar este equipo? Se eliminará de la lista de activos a disposición.')) {
                              onRetireEquipment?.(req.ownDetails?.equipo_id || '');
                            }
                          }}
                          className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
                          title="Retirar equipo"
                        >
                          <Trash2 size={13} /> Retirar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

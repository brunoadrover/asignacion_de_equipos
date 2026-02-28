import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Save, X, Settings, Shield, Lock, Users, UserPlus } from 'lucide-react';
import { Button } from './Button';
import { UnidadOperativa, UserRole, UserConfig } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  uos_list: UnidadOperativa[];
  onAddUO: (name: string) => void;
  onDeleteUO: (name: string) => void;
  onEditUO: (oldName: string, newName: string) => void;

  categories: string[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    uos_list, onAddUO, onDeleteUO, onEditUO,
    categories, onAddCategory, onDeleteCategory, onEditCategory
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configuración</h2>
            <p className="text-sm text-slate-500">Gestión de listas y parámetros del sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ListManager 
                title="Unidades Operativas (UO)"
                items={uos_list.map(u => u.nombre)}
                onAdd={onAddUO}
                onEdit={onEditUO}
                onDelete={onDeleteUO}
                placeholder="Nombre de nueva Unidad Operativa"
            />
            
            <ListManager 
                title="Categorías de Equipos"
                items={categories}
                onAdd={onAddCategory}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
                placeholder="Nueva Categoría (Ej: Rodados)"
            />
        </div>

        {/* User Management Section */}
        <div className="mt-8 pt-8 border-t border-slate-200">
             <UserManager uos={uos_list} />
        </div>

        {/* Notification Settings Section */}
        <div className="mt-8 pt-8 border-t border-slate-200">
             <NotificationManager uos={uos_list} />
        </div>
      </div>
    </div>
  );
};

// Notification Manager Component
const NotificationManager: React.FC<{ uos: UnidadOperativa[] }> = ({ uos }) => {
    const [configs, setConfigs] = useState<UserConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUoId, setEditingUoId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<UserConfig>>({});

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('configuracion_sistema')
            .select('*')
            .eq('rol', 'NOTIFICATION_CONFIG');
        if (!error && data) {
            setConfigs(data);
        }
        setIsLoading(false);
    };

    const handleSave = async (uoId: string) => {
        const clave = `NOTIF_UO_${uoId}`;
        const payload = {
            clave,
            valor: 'CONFIG',
            rol: 'NOTIFICATION_CONFIG',
            uidad_operativa_id: uoId,
            correo1: editValues.correo1 || '',
            correo2: editValues.correo2 || '',
            correo3: editValues.correo3 || '',
            correo4: editValues.correo4 || ''
        };

        const { error } = await supabase.from('configuracion_sistema').upsert(payload);
        if (!error) {
            fetchConfigs();
            setEditingUoId(null);
        } else {
            alert("Error al guardar configuración: " + error.message);
        }
    };

    const startEditing = (uoId: string) => {
        const existing = configs.find(c => c.uidad_operativa_id === uoId);
        setEditingUoId(uoId);
        setEditValues(existing || { correo1: '', correo2: '', correo3: '', correo4: '' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Notificaciones por UO</h3>
                    <p className="text-sm text-slate-500">Configure los destinatarios de correo para cada Unidad Operativa</p>
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">Nota: Si usa Resend en modo prueba, solo podrá enviar correos a la dirección registrada en su cuenta.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                        <tr>
                            <th className="px-4 py-3">Unidad Operativa</th>
                            <th className="px-4 py-3">Correo 1</th>
                            <th className="px-4 py-3">Correo 2</th>
                            <th className="px-4 py-3">Correo 3</th>
                            <th className="px-4 py-3">Correo 4</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {uos.map(uo => {
                            const config = configs.find(c => c.uidad_operativa_id === uo.id);
                            const isEditing = editingUoId === uo.id;

                            return (
                                <tr key={uo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-700">{uo.nombre}</td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input type="email" className="w-full p-1 border rounded text-xs" value={editValues.correo1 || ''} onChange={e => setEditValues({...editValues, correo1: e.target.value})} />
                                        ) : (config?.correo1 || '-')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input type="email" className="w-full p-1 border rounded text-xs" value={editValues.correo2 || ''} onChange={e => setEditValues({...editValues, correo2: e.target.value})} />
                                        ) : (config?.correo2 || '-')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input type="email" className="w-full p-1 border rounded text-xs" value={editValues.correo3 || ''} onChange={e => setEditValues({...editValues, correo3: e.target.value})} />
                                        ) : (config?.correo3 || '-')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input type="email" className="w-full p-1 border rounded text-xs" value={editValues.correo4 || ''} onChange={e => setEditValues({...editValues, correo4: e.target.value})} />
                                        ) : (config?.correo4 || '-')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleSave(uo.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Save size={16} /></button>
                                                <button onClick={() => setEditingUoId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEditing(uo.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// User Manager Component
const UserManager: React.FC<{ uos: UnidadOperativa[] }> = ({ uos }) => {
    const [users, setUsers] = useState<UserConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState<Partial<UserConfig>>({
        rol: UserRole.USER,
        uidad_operativa_id: uos[0]?.id || ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('configuracion_sistema')
            .select('*')
            .in('rol', [UserRole.ADMIN, UserRole.USER]);
        if (!error && data) {
            setUsers(data);
        }
        setIsLoading(false);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.clave || !newUser.valor) return;

        const payload: any = {
            clave: newUser.clave,
            valor: newUser.valor,
            usuario: newUser.usuario || newUser.clave,
            rol: newUser.rol,
            uidad_operativa_id: newUser.rol === UserRole.ADMIN ? null : newUser.uidad_operativa_id
        };

        const { error } = await supabase.from('configuracion_sistema').insert(payload);
        if (!error) {
            fetchUsers();
            setIsAdding(false);
            setNewUser({ rol: UserRole.USER, uidad_operativa_id: uos[0]?.id || '' });
        } else {
            alert("Error al agregar usuario: " + error.message);
        }
    };

    const handleDeleteUser = async (clave: string) => {
        if (confirm("¿Está seguro de eliminar este acceso?")) {
            const { error } = await supabase.from('configuracion_sistema').delete().eq('clave', clave);
            if (!error) fetchUsers();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Control de Acceso</h3>
                        <p className="text-sm text-slate-500">Gestione los usuarios y sus permisos por UO</p>
                    </div>
                </div>
                <Button onClick={() => setIsAdding(true)} variant="primary" className="bg-[#1B4D3E] hover:bg-[#113026]">
                    <UserPlus size={18} className="mr-2" /> Agregar Usuario
                </Button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-6 rounded-xl border border-emerald-100 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Usuario / ID</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-2 border rounded-md text-sm bg-white text-slate-900"
                                placeholder="Ej: admin_central"
                                value={newUser.clave || ''}
                                onChange={e => setNewUser({...newUser, clave: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Contraseña</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-2 border rounded-md text-sm bg-white text-slate-900"
                                placeholder="Clave de acceso"
                                value={newUser.valor || ''}
                                onChange={e => setNewUser({...newUser, valor: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Rol</label>
                            <select 
                                className="w-full p-2 border rounded-md text-sm bg-white text-slate-900"
                                value={newUser.rol}
                                onChange={e => setNewUser({...newUser, rol: e.target.value as UserRole})}
                            >
                                <option value={UserRole.ADMIN}>ADMIN</option>
                                <option value={UserRole.USER}>USER (Solo UO)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Unidad Operativa</label>
                            <select 
                                disabled={newUser.rol === UserRole.ADMIN}
                                className="w-full p-2 border rounded-md text-sm bg-white text-slate-900 disabled:bg-slate-100"
                                value={newUser.uidad_operativa_id || ''}
                                onChange={e => setNewUser({...newUser, uidad_operativa_id: e.target.value})}
                            >
                                <option value="">Seleccione UO</option>
                                {uos.map(uo => <option key={uo.id} value={uo.id}>{uo.nombre}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="success" className="flex-1">Guardar</Button>
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                        <tr>
                            <th className="px-4 py-3">Usuario</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Unidad Operativa</th>
                            <th className="px-4 py-3">Clave</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.clave} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-700">{user.usuario || user.clave}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.rol === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                    {user.rol === UserRole.ADMIN ? 'Todas (Acceso Total)' : uos.find(u => u.id === user.uidad_operativa_id)?.nombre || 'No asignada'}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-400">••••••••</td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(user.clave)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No hay usuarios configurados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Reusable Sub-component for List Management (CRUD)
interface ListManagerProps {
    title: string;
    items: string[];
    onAdd: (val: string) => void;
    onEdit: (oldVal: string, newVal: string) => void;
    onDelete: (val: string) => void;
    placeholder: string;
}

const ListManager: React.FC<ListManagerProps> = ({ title, items, onAdd, onEdit, onDelete, placeholder }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    const startEdit = (item: string) => {
        setEditingItem(item);
        setEditValue(item);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditValue('');
    };

    const saveEdit = (oldItem: string) => {
        if (editValue.trim() && editValue !== oldItem) {
            onEdit(oldItem, editValue.trim());
        }
        setEditingItem(null);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                {title}
            </h3>
            
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 text-sm bg-white text-slate-900"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                <Button type="submit" variant="success" size="sm" disabled={!newItem.trim()}>
                    <Plus size={18} />
                </Button>
            </form>

            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex-1 max-h-[400px] overflow-y-auto">
                <ul className="divide-y divide-slate-200">
                    {items.map((item) => (
                    <li key={item} className="p-3 flex items-center justify-between hover:bg-white transition-colors group">
                        {editingItem === item ? (
                        <div className="flex-1 flex gap-2 items-center mr-2">
                            <input
                            autoFocus
                            type="text"
                            className="flex-1 rounded border-slate-300 border p-1 text-sm bg-white text-slate-900"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            />
                            <button onClick={() => saveEdit(item)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                            <Save size={16} />
                            </button>
                            <button onClick={cancelEdit} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                            <X size={16} />
                            </button>
                        </div>
                        ) : (
                        <span className="text-slate-700 font-medium text-sm pl-2">{item}</span>
                        )}

                        {editingItem !== item && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                            >
                            <Pencil size={14} />
                            </button>
                            <button 
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                        )}
                    </li>
                    ))}
                    {items.length === 0 && (
                    <li className="p-4 text-center text-slate-400 text-sm italic">
                        Sin elementos cargados.
                    </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
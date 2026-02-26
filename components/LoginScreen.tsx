import React, { useState, useEffect } from 'react';
import { ChevronRight, Lock, Building2 } from 'lucide-react';
import { Button } from './Button';
import { UnidadOperativa, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: { rol: UserRole; uo_id?: string; name: string }) => void;
  uos: UnidadOperativa[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, uos }) => {
  const [selectedUoId, setSelectedUoId] = useState<string>('ADMIN');
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(false);

    try {
      if (selectedUoId === 'ADMIN') {
        // Check for admin password in configuracion_sistema
        const { data, error: dbError } = await supabase
          .from('configuracion_sistema')
          .select('*')
          .eq('rol', 'ADMIN')
          .eq('valor', inputPassword)
          .single();

        if (data && !dbError) {
          onLogin({ 
            rol: UserRole.ADMIN, 
            name: data.usuario || data.clave 
          });
        } else {
          setError(true);
          setInputPassword('');
        }
      } else {
        // Check for user password for specific UO
        const { data, error: dbError } = await supabase
          .from('configuracion_sistema')
          .select('*')
          .eq('uidad_operativa_id', selectedUoId)
          .eq('valor', inputPassword)
          .single();

        if (data && !dbError) {
          onLogin({ 
            rol: UserRole.USER, 
            uo_id: selectedUoId, 
            name: data.usuario || data.clave 
          });
        } else {
          setError(true);
          setInputPassword('');
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4D3E] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header / Logo Area */}
        <div className="bg-[#113026] p-8 text-center flex flex-col items-center justify-center border-b border-emerald-900/30">
            <h1 
                className="text-6xl font-bold text-white tracking-tighter leading-none mb-2"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
                GE<span className="text-5xl italic">y</span>T
            </h1>
            <h2 className="text-xs font-medium text-white/80 uppercase tracking-[0.2em] mt-2">
                Asignación de Equipos
            </h2>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-10">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Bienvenido</h3>
            <p className="text-slate-500 text-sm mt-1">Seleccione su UO e ingrese su clave</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
                Unidad Operativa
              </label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                <select
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#1B4D3E] focus:ring-emerald-100 focus:outline-none focus:ring-4 transition-all bg-slate-50 text-slate-900 appearance-none"
                  value={selectedUoId}
                  onChange={(e) => setSelectedUoId(e.target.value)}
                >
                  <option value="ADMIN">Gerencia de Equipos y Transporte</option>
                  {uos.map(uo => (
                    <option key={uo.id} value={uo.id}>{uo.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#1B4D3E] focus:ring-emerald-100'
                  } focus:outline-none focus:ring-4 transition-all bg-slate-50 text-slate-900 placeholder:text-slate-400`}
                  placeholder="••••••••"
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setError(false);
                  }}
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 font-medium ml-1 animate-in slide-in-from-left-1">
                  Clave incorrecta para la unidad seleccionada.
                </p>
              )}
            </div>

            <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#1B4D3E] hover:bg-[#153e32] disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <Lock className="animate-pulse" size={18} /> Verificando...
                  </span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ChevronRight size={18} />
                  </>
                )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-400">© 2026 Gerencia de Equipos y Transporte</p>
        </div>
      </div>
    </div>
  );
};

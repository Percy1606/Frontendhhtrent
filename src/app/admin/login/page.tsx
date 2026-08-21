'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { saveSession, getToken, getStoredUser, API_URL } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const redirectByRole = (rol?: string) => {
    switch (rol) {
      case 'COMERCIAL':
        router.replace('/admin/cotizaciones');
        break;
      case 'LOGISTICA':
        router.replace('/admin/alquileres');
        break;
      case 'OPERACIONES':
        router.replace('/admin/mantenimiento');
        break;
      case 'ADMINISTRADOR':
      case 'ALMACEN':
      default:
        router.replace('/admin/equipos');
        break;
    }
  };

  useEffect(() => {
    if (getToken()) {
      const user = getStoredUser();
      redirectByRole(user?.rol);
    }
  }, [router]);

  const validateFields = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'El correo o usuario es requerido';
    } else if (email.includes('@') && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Formato de correo inválido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Credenciales inválidas. Por favor, verifique sus datos.');
        setLoading(false);
        return;
      }

      saveSession(data.token, data.usuario, rememberMe);
      redirectByRole(data.usuario?.rol);
    } catch {
      setError('No se pudo conectar con el servidor. Verifique su conexión de red o contacte a soporte.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex font-poppins">
      {/* Columna Izquierda - Identidad Corporativa (Oculto en móvil) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-[#0A1424]">
        {/* Imagen de fondo con overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888081622-19e917d5e6ff?q=80&w=2000&auto=format&fit=crop')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1424] via-[#162B4D]/90 to-[#162B4D]/40 z-0" />
        
        {/* Contenido Superior Izquierdo */}
        <div className="relative z-10 p-12 xl:p-16">
          <div className="bg-white/95 p-3 rounded-xl inline-block shadow-lg mb-10">
            <Image
              src="/img/hhtrentlogo.jpg"
              alt="HT RENT Logo"
              width={160}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            SISTEMA DE VENTAS <span className="text-[#3b82f6]">HHTRENT</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
            Gestiona, controla y haz crecer tus ventas en un solo lugar.
          </p>

          <div className="mt-14 space-y-6">
            <div className="flex items-center gap-4 text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Ventas más ágiles</h3>
                <p className="text-sm text-slate-400">Optimiza tus procesos comerciales diarios.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Clientes</h3>
                <p className="text-sm text-slate-400">Seguimiento y fidelización en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Mayor rentabilidad</h3>
                <p className="text-sm text-slate-400">Métricas exactas para decisiones inteligentes.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Gestión segura</h3>
                <p className="text-sm text-slate-400">Control de accesos e información encriptada.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Izquierdo */}
        <div className="relative z-10 p-12 xl:p-16 pb-8">
          <p className="text-sm text-slate-500 font-medium">
            © 2026 HHTRENT S.A.C. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Columna Derecha - Formulario de Login */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md">
          
          {/* Logo visible solo en móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
              <Image
                src="/img/hhtrentlogo.jpg"
                alt="HT RENT Logo"
                width={160}
                height={50}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#162B4D] tracking-tight">BIENVENIDO</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Ingresa a tu sistema de ventas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-2 ml-1">
                Usuario o Correo
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${fieldErrors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#162B4D]'}`} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder="ejemplo@hhtrent.com"
                  className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 transition-all duration-300 placeholder:text-slate-400 shadow-sm ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-[#3b82f6] focus:ring-[#3b82f6]/10 hover:border-slate-300'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium animate-pulse">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-2 ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#162B4D]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-4 bg-white border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 transition-all duration-300 placeholder:text-slate-400 shadow-sm ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-[#3b82f6] focus:ring-[#3b82f6]/10 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors duration-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium animate-pulse">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-[6px] bg-white checked:bg-[#3b82f6] checked:border-[#3b82f6] transition-all duration-200 cursor-pointer"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" />
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  Recordarme
                </span>
              </label>

              <Link
                href="/admin/olvide-password"
                className="text-sm font-bold text-[#3b82f6] hover:text-[#1d4ed8] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50/80 border border-red-200 text-red-700 text-sm font-medium p-4 rounded-2xl animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#162B4D] hover:bg-[#0f1d35] text-white font-bold text-[15px] rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-[#162B4D]/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                  <span>INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-1 bg-slate-200 rounded-full mb-2"></div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Sistema de Ventas | ERP / CRM
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

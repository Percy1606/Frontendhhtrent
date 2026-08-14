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
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { saveSession, getToken, API_URL } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Si ya hay sesión, redirigir
    if (getToken()) {
      router.replace('/admin/equipos');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Credenciales inválidas');
        setLoading(false);
        return;
      }

      saveSession(data.token, data.usuario);
      router.replace('/admin/equipos');
    } catch {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-poppins relative overflow-hidden">
      {/* DECORACIÓN Y GLOW DE FONDO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#162B4D]/10 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[#E63C46]/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* LOGO DE LA EMPRESA Y TÍTULO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/img/hhtrentlogo.jpg"
              alt="HT RENT Logo"
              width={220}
              height={70}
              className="h-16 w-auto object-contain mix-blend-multiply"
              priority
            />
          </div>
          <h1 className="font-spartan font-[800] text-xl text-slate-900 uppercase tracking-wider">
            Sistema Integral de Gestión
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-[500] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E63C46]" />
            Plataforma Administrativa HT RENT
          </p>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="bg-white rounded-[28px] shadow-2xl shadow-slate-200/80 border border-slate-200/80 p-8">
          <div className="flex items-center gap-3.5 mb-6 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="font-spartan font-[800] text-slate-900 text-base tracking-tight leading-snug">
                Acceso Restringido
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Personal autorizado y administradores
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-600 mb-1.5">
                Correo Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hhtrent.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-900 focus:outline-none focus:border-[#162B4D] focus:bg-white focus:ring-2 focus:ring-[#162B4D]/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-900 focus:outline-none focus:border-[#162B4D] focus:bg-white focus:ring-2 focus:ring-[#162B4D]/10 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-[500] p-3.5 rounded-[14px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#162B4D] hover:bg-[#10203B] text-white font-[800] text-sm rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#162B4D]/25 border border-[#162B4D] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#E63C46]" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/admin/olvide-password"
              className="text-[11px] font-[700] text-slate-500 hover:text-[#E63C46] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-xs font-[700] text-slate-500 hover:text-[#162B4D] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Volver al sitio público
        </Link>
      </div>
    </main>
  );
}

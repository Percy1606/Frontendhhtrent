'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { saveSession, getToken, getStoredUser, API_URL } from '@/lib/api';

const SLIDES = [
  {
    title: 'CONTROL DE ALQUILERES',
    subtitle: 'Gestiona todos tus alquileres en un solo lugar.',
    description: 'Controla equipos, clientes, contratos y fechas de devolución de manera eficiente.',
    image: 'https://images.unsplash.com/photo-1541888081622-19e917d5e6ff?q=80&w=2000&auto=format&fit=crop', // Alquileres / proyectos
  },
  {
    title: 'DISPONIBILIDAD DE EQUIPOS',
    subtitle: 'Nunca pierdas el control de tus equipos.',
    description: 'Conoce en tiempo real qué equipos están disponibles, alquilados o en mantenimiento.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356f58?q=80&w=2000&auto=format&fit=crop', // Equipos disponibles
  },
  {
    title: 'RENTABILIDAD OPERATIVA',
    subtitle: 'Más control, mayor rentabilidad.',
    description: 'Analiza ingresos, egresos y la rentabilidad de cada proyecto u orden de servicio.',
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=2000&auto=format&fit=crop', // Gráficos / proyectos industriales
  },
  {
    title: 'MANTENIMIENTO',
    subtitle: 'Anticípate a los problemas.',
    description: 'Gestiona mantenimientos preventivos y correctivos para mantener tus equipos operativos.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2000&auto=format&fit=crop', // Técnicos revisando
  },
  {
    title: 'CLIENTES Y PROYECTOS',
    subtitle: 'Toda tu operación conectada.',
    description: 'Centraliza clientes, proyectos, contratos y operaciones en un solo sistema.',
    image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?q=80&w=2000&auto=format&fit=crop', // Obra civil
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  // Estado para el carrusel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formMounted, setFormMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para redirigir según el rol
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
    setFormMounted(true); // Activa la animación del form
    if (getToken()) {
      const user = getStoredUser();
      redirectByRole(user?.rol);
    }
  }, [router]);

  // Manejo del temporizador del carrusel ininterrumpible
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 5500);
  }, [nextSlide]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handleIndicatorClick = (index: number) => {
    setCurrentSlide(index);
    startTimer(); // Reinicia el tiempo al clickear
  };

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
    <main className="min-h-screen bg-slate-50 flex font-poppins selection:bg-[#0361CA] selection:text-white">
      
      {/* Columna Izquierda - Carrusel Informativo (Oculto en móvil) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-[#0F172A]">
        
        {/* Imágenes de Fondo Dinámicas del Carrusel */}
        {SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? 'opacity-50 mix-blend-overlay' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        {/* Overlay Azul Marino Oscuro para asegurar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#021A3D]/95 via-[#032859]/80 to-[#0F172A]/90 z-0 pointer-events-none" />
        
        {/* Contenido Izquierdo */}
        <div className="relative z-10 p-12 xl:p-20 flex flex-col justify-between h-full max-w-4xl mx-auto w-full">
          
          {/* Logo */}
          <div className="bg-white p-6 rounded-2xl inline-flex items-center justify-center shadow-[0_10px_40px_rgb(0,0,0,0.2)] self-start transform transition-transform hover:scale-105 duration-300">
            <Image
              src="/img/hhtrentlogo.jpg"
              alt="HT RENT Logo"
              width={260}
              height={80}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          
          {/* Textos del Carrusel con Transiciones de Fade + Slide y escalonamiento */}
          <div className="flex-1 flex flex-col justify-center min-h-[350px] relative mt-12">
            {SLIDES.map((slide, index) => (
              <div
                key={index}
                className={`absolute left-0 right-0 ${
                  currentSlide === index ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
                }`}
              >
                <h3 
                  className={`text-xl xl:text-2xl text-[#60A5FA] font-bold tracking-[0.2em] uppercase mb-4 transition-all duration-700 ease-out ${
                    currentSlide === index ? 'opacity-100 translate-y-0 delay-[100ms]' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.title}
                </h3>
                <h1 
                  className={`text-5xl xl:text-[3.5rem] font-extrabold text-white leading-[1.15] mb-6 tracking-tight transition-all duration-700 ease-out ${
                    currentSlide === index ? 'opacity-100 translate-y-0 delay-[250ms]' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.subtitle}
                </h1>
                <p 
                  className={`text-xl xl:text-2xl text-slate-200 font-medium max-w-2xl leading-relaxed transition-all duration-700 ease-out ${
                    currentSlide === index ? 'opacity-100 translate-y-0 delay-[400ms]' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {slide.description}
                </p>
              </div>
            ))}
          </div>

          {/* Indicadores y Footer */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-10">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleIndicatorClick(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                    currentSlide === index 
                      ? 'w-16 bg-[#0361CA] shadow-[0_0_15px_rgba(3,97,202,0.8)]' 
                      : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Ir a slide ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-300 font-medium tracking-wide">
              © 2026 HHTRENT S.A.C. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Columna Derecha - Formulario de Login */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white">
        
        {/* Contenedor Tarjeta Login con animación de entrada */}
        <div 
          className={`bg-white p-10 sm:p-12 xl:p-16 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 w-full max-w-[32rem] transition-all duration-1000 ease-out transform ${
            formMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          
          {/* Logo visible solo en móvil */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100">
              <Image
                src="/img/hhtrentlogo.jpg"
                alt="HT RENT Logo"
                width={200}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">BIENVENIDO</h2>
            <p className="text-base text-slate-500 mt-3 font-medium">Ingresa a tu sistema ERP / CRM HHTRENT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 xl:space-y-7" noValidate>
            
            {/* Input Usuario/Correo */}
            <div className="relative group/input">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 ml-1 transition-colors group-focus-within/input:text-[#0361CA]">
                Usuario o Correo
              </label>
              <div className="relative">
                <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors duration-300 z-10 ${fieldErrors.email ? 'text-red-500' : 'text-slate-400 group-focus-within/input:text-[#0361CA]'}`} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder="ejemplo@hhtrent.com"
                  className={`w-full pl-14 pr-5 py-4 xl:py-5 bg-slate-50 border-2 rounded-2xl text-base xl:text-lg text-slate-900 focus:outline-none focus:bg-white transition-all duration-300 placeholder:text-slate-400 hover:bg-slate-100/50 ${
                    fieldErrors.email 
                      ? 'border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]' 
                      : 'border-slate-200 focus:border-[#0361CA] hover:border-slate-300 focus:shadow-[0_0_0_4px_rgba(3,97,202,0.15)]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-2 ml-1 font-semibold animate-pulse">{fieldErrors.email}</p>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="relative group/input">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 ml-1 transition-colors group-focus-within/input:text-[#0361CA]">
                Contraseña
              </label>
              <div className="relative">
                <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors duration-300 z-10 ${fieldErrors.password ? 'text-red-500' : 'text-slate-400 group-focus-within/input:text-[#0361CA]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-14 pr-14 py-4 xl:py-5 bg-slate-50 border-2 rounded-2xl text-base xl:text-lg text-slate-900 focus:outline-none focus:bg-white transition-all duration-300 placeholder:text-slate-400 hover:bg-slate-100/50 ${
                    fieldErrors.password 
                      ? 'border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]' 
                      : 'border-slate-200 focus:border-[#0361CA] hover:border-slate-300 focus:shadow-[0_0_0_4px_rgba(3,97,202,0.15)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:scale-110 transition-all duration-200 p-2 rounded-xl hover:bg-slate-200 z-10"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-2 ml-1 font-semibold animate-pulse">{fieldErrors.password}</p>
              )}
            </div>

            {/* Opciones Adicionales */}
            <div className="flex items-center justify-between pt-2 pb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-[8px] bg-white checked:bg-[#0361CA] checked:border-[#0361CA] focus:outline-none focus:ring-2 focus:ring-[#0361CA]/30 focus:ring-offset-1 hover:border-slate-400 transition-all duration-200 cursor-pointer shadow-sm"
                  />
                  <ShieldCheck className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-all duration-300 scale-50 peer-checked:scale-100" />
                </div>
                <span className="text-[15px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Recordarme
                </span>
              </label>

              <Link
                href="/admin/olvide-password"
                className="text-[15px] font-bold text-[#0361CA] hover:text-[#024a9c] hover:underline underline-offset-4 transition-all"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Mensaje de Error API */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50/90 border-2 border-red-200 text-red-700 text-sm font-semibold p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-2 bg-[#0361CA] hover:bg-[#024A9B] hover:shadow-[0_15px_30px_-10px_rgba(3,97,202,0.6)] hover:-translate-y-1 text-white font-bold text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_-10px_rgba(3,97,202,0.4)] active:scale-[0.98] active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden relative"
            >
              {/* Efecto hover brillante */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              
              {loading ? (
                <>
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6 text-white/90 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                  <span className="tracking-wide">INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-1 bg-slate-200 rounded-full mb-2"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Sistema de Ventas | ERP / CRM
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

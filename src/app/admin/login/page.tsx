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
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Power_lines_and_pylon_on_the_skyline_at_sunset_-_geograph.org.uk_-_632839.jpg',
  },
  {
    title: 'DISPONIBILIDAD DE EQUIPOS',
    subtitle: 'Nunca pierdas el control de tus equipos.',
    description: 'Conoce en tiempo real qué equipos están disponibles, alquilados o en mantenimiento.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Caterpillar_330_excavator_on_a_pile_of_dirt.jpg',
  },
  {
    title: 'RENTABILIDAD OPERATIVA',
    subtitle: 'Más control, mayor rentabilidad.',
    description: 'Analiza ingresos, egresos y la rentabilidad de cada proyecto u orden de servicio.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Electrical_substation%2C_Parvomaitsi.jpg',
  },
  {
    title: 'MANTENIMIENTO',
    subtitle: 'Anticípate a los problemas.',
    description: 'Gestiona mantenimientos preventivos y correctivos para mantener tus equipos operativos.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Fieldphotofriday.jpg',
  },
  {
    title: 'CLIENTES Y PROYECTOS',
    subtitle: 'Toda tu operación conectada.',
    description: 'Centraliza clientes, proyectos, contratos y operaciones en un solo sistema.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Transmission_towers_at_sunset_in_East_Texas.jpg',
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
      <div 
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-[#0A1424] cursor-pointer group/carousel"
        onClick={() => {
          nextSlide();
          startTimer();
        }}
      >
        
        {/* Imágenes de Fondo Dinámicas del Carrusel */}
        {SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={true} // Obliga al navegador a precargar todas las imágenes al instante
              sizes="55vw"
              quality={85}
            />
          </div>
        ))}
        {/* Overlay ultra suave, dejando que la imagen original se vea al máximo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F203C]/70 via-[#0A1424]/40 to-[#0A1424]/80 z-0 pointer-events-none" />
        
        {/* Contenido Izquierdo */}
        <div className="relative z-10 p-12 xl:p-20 flex flex-col justify-between h-full max-w-4xl mx-auto w-full">
          
          {/* Logo - Estilo Nativo y Compacto */}
          <div className="self-start inline-flex items-center justify-center animate-in fade-in slide-in-from-top-8 duration-1000 fill-mode-both">
            <Image
              src="/img/hhtrentlogo.jpg"
              alt="HT RENT Logo"
              width={280}
              height={90}
              quality={100}
              className="h-12 sm:h-14 xl:h-16 w-auto object-contain rounded-md shadow-sm hover:scale-[1.03] transition-transform duration-300"
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
                  onMouseEnter={() => handleIndicatorClick(index)}
                  className={`relative h-2.5 rounded-full transition-all duration-500 ease-out outline-none ${
                    currentSlide === index 
                      ? 'w-16 bg-[#0361CA] shadow-[0_0_15px_rgba(3,97,202,0.8)]' 
                      : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Ir a slide ${index + 1}`}
                >
                  {/* Área invisible ampliada para que el hover sea muy suave y fácil */}
                  <span className="absolute -inset-4" />
                </button>
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
          className={`bg-white p-8 sm:p-10 xl:p-12 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 w-full max-w-[28rem] transition-all duration-1000 ease-out transform ${
            formMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          
          {/* Logo visible solo en móvil */}
          <div className="lg:hidden flex justify-center mb-6 w-full animate-in fade-in slide-in-from-top-6 duration-1000 fill-mode-both">
            <div className="inline-flex items-center justify-center">
              <Image
                src="/img/hhtrentlogo.jpg"
                alt="HT RENT Logo"
                width={220}
                height={70}
                quality={100}
                className="h-11 sm:h-14 w-auto object-contain rounded-sm"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">BIENVENIDO DE NUEVO</h2>
            <p className="text-sm text-slate-500 mt-2.5 font-medium">Plataforma Integral de Gestión HHTRENT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 xl:space-y-6" noValidate>
            
            {/* Input Usuario/Correo */}
            <div className="relative group/input">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 ml-1 transition-colors group-focus-within/input:text-[#0361CA]">
                Correo Electrónico o Usuario
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 z-10 ${fieldErrors.email ? 'text-red-500' : 'text-slate-400 group-focus-within/input:text-[#0361CA]'}`} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder="admin@hhtrent.com"
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 rounded-xl text-sm xl:text-base text-slate-900 focus:outline-none focus:bg-white transition-all duration-300 placeholder:text-slate-400 hover:bg-slate-100/50 ${
                    fieldErrors.email 
                      ? 'border-red-400 focus:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' 
                      : 'border-slate-200 focus:border-[#0361CA] hover:border-slate-300 focus:shadow-[0_0_0_3px_rgba(3,97,202,0.15)]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-semibold animate-pulse">{fieldErrors.email}</p>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="relative group/input">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 ml-1 transition-colors group-focus-within/input:text-[#0361CA]">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 z-10 ${fieldErrors.password ? 'text-red-500' : 'text-slate-400 group-focus-within/input:text-[#0361CA]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 rounded-xl text-sm xl:text-base text-slate-900 focus:outline-none focus:bg-white transition-all duration-300 placeholder:text-slate-400 hover:bg-slate-100/50 ${
                    fieldErrors.password 
                      ? 'border-red-400 focus:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' 
                      : 'border-slate-200 focus:border-[#0361CA] hover:border-slate-300 focus:shadow-[0_0_0_3px_rgba(3,97,202,0.15)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:scale-110 transition-all duration-200 p-1.5 rounded-lg hover:bg-slate-200 z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-semibold animate-pulse">{fieldErrors.password}</p>
              )}
            </div>

            {/* Opciones Adicionales */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md bg-white checked:bg-[#0361CA] checked:border-[#0361CA] focus:outline-none focus:ring-2 focus:ring-[#0361CA]/30 focus:ring-offset-1 hover:border-slate-400 transition-all duration-200 cursor-pointer shadow-sm"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-all duration-300 scale-50 peer-checked:scale-100" />
                </div>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Mantener sesión
                </span>
              </label>

              <Link
                href="/admin/olvide-password"
                className="text-sm font-bold text-[#0361CA] hover:text-[#024a9c] hover:underline underline-offset-4 transition-all"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Mensaje de Error API */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50/90 border-2 border-red-200 text-red-700 text-sm font-semibold p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-1 bg-[#0361CA] hover:bg-[#024A9B] hover:shadow-[0_12px_24px_-8px_rgba(3,97,202,0.5)] hover:-translate-y-0.5 text-white font-bold text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_8px_16px_-8px_rgba(3,97,202,0.4)] active:scale-[0.98] active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden relative"
            >
              {/* Efecto hover brillante */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-white/90 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                  <span className="tracking-wide">INGRESAR AL SISTEMA</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 xl:mt-12 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-1 bg-slate-200 rounded-full mb-1"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
              Alquiler y Renta de Equipos
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  User,
  ChevronDown,
  Clock,
  BadgeDollarSign,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { leerCarrito, guardarCarrito, type CartItem } from '@/lib/cart';
import { tipoLabel } from '@/lib/equipo';
import { imagenCompleta } from '@/lib/api';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Carrito de compras
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCargado, setCartCargado] = useState(false);

  // Submenú Catálogo
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [addedItemToast, setAddedItemToast] = useState<{ nombre: string; imagenUrl: string } | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar carrito desde localStorage
  useEffect(() => {
    setCart(leerCarrito());
    setCartCargado(true);

    const handleCartUpdated = (e: any) => {
      setCart(leerCarrito());
      if (e.detail?.addedItem) {
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
        setAddedItemToast(e.detail.addedItem);
        toastTimerRef.current = setTimeout(() => {
          setAddedItemToast(null);
          toastTimerRef.current = null;
        }, 3200);
      }
      if (e.detail?.openDrawer) {
        setCartDrawerOpen(true);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdated as EventListener);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated as EventListener);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Persistir los cambios del carrito (cantidades, quitar, vaciar) en localStorage
  useEffect(() => {
    if (cartCargado) {
      guardarCarrito(cart);
    }
  }, [cart, cartCargado]);

  const [activeSection, setActiveSection] = useState('inicio');
  const isScrolling = React.useRef(false);

  const handleLinkClick = (section: string) => {
    isScrolling.current = true;
    setActiveSection(section);
    setTimeout(() => {
      isScrolling.current = false;
    }, 800);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling.current) return;
      setScrolled(window.scrollY > 20);

      // Track active section based on scroll offset
      const sections = ['inicio', 'nosotros', 'servicios', 'catalogo', 'sedes', 'contacto'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetHeight = el.offsetHeight;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }

      if (window.scrollY < 100 && !window.location.pathname.includes('/cotizacion')) {
        setActiveSection('inicio');
      }
    };

    if (window.location.pathname.includes('/cotizacion')) {
      setActiveSection('contacto');
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once initially
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalCount = cart.reduce((acc, curr) => acc + curr.cantidad, 0);
  const subtotal = cart.reduce((acc, curr) => acc + (typeof curr.precio === 'number' ? curr.precio : 0) * curr.cantidad, 0);
  const total = subtotal * 1.18;

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <>
      {/* HEADER EN UNA SOLA FILA HORIZONTAL (74px) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white font-poppins shadow-sm border-b border-slate-100 h-[74px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          
          {/* 1. EXTREMO IZQUIERDO: LOGO HT RENT */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 py-1">
            <img
              src="/img/hhtrentlogo.jpg"
              alt="HT RENT"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* 2. CENTRO-IZQUIERDA: MENÚ DE NAVEGACIÓN (Escritorio) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 h-full font-montserrat font-[800] text-xs uppercase tracking-wider shrink-0">
            <a
              href="/#"
              onClick={() => handleLinkClick('inicio')}
              className={`h-full flex items-center transition-colors relative group ${
                activeSection === 'inicio' ? 'text-[#E63C46]' : 'text-[#1A1A1A] hover:text-[#E63C46]'
              }`}
            >
              <span>Inicio</span>
              <span className={`absolute bottom-0 left-0 h-[3px] bg-[#E63C46] rounded-full transition-all duration-300 ${
                activeSection === 'inicio' ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </a>

            <a
              href="/#nosotros"
              onClick={() => handleLinkClick('nosotros')}
              className={`h-full flex items-center transition-colors relative group ${
                activeSection === 'nosotros' ? 'text-[#E63C46]' : 'text-[#1A1A1A] hover:text-[#E63C46]'
              }`}
            >
              <span>Nosotros</span>
              <span className={`absolute bottom-0 left-0 h-[3px] bg-[#E63C46] rounded-full transition-all duration-300 ${
                activeSection === 'nosotros' ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </a>
            
            <a
              href="/#servicios"
              onClick={() => handleLinkClick('servicios')}
              className={`h-full flex items-center transition-colors relative group ${
                activeSection === 'servicios' ? 'text-[#E63C46]' : 'text-[#1A1A1A] hover:text-[#E63C46]'
              }`}
            >
              <span>Especialidades</span>
              <span className={`absolute bottom-0 left-0 h-[3px] bg-[#E63C46] rounded-full transition-all duration-300 ${
                activeSection === 'servicios' ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </a>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setCatalogoOpen(true)}
              onMouseLeave={() => setCatalogoOpen(false)}
            >
              <a
                href="/#catalogo"
                onClick={() => handleLinkClick('catalogo')}
                className={`h-full flex items-center gap-1.5 transition-colors relative group ${
                  activeSection === 'catalogo' || catalogoOpen
                    ? 'text-[#E63C46]'
                    : 'text-[#1A1A1A] hover:text-[#E63C46]'
                }`}
              >
                <span>Catálogo</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${catalogoOpen ? 'rotate-180' : ''}`}
                />
                <span className={`absolute bottom-0 left-0 h-[3px] bg-[#E63C46] rounded-full transition-all duration-300 ${
                  activeSection === 'catalogo' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </a>

              <AnimatePresence>
                {catalogoOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-72 bg-white rounded-[16px] shadow-2xl border border-slate-100 p-2 z-50"
                  >
                    <Link
                      href="/equipos"
                      onClick={() => setCatalogoOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-[700] text-slate-700 hover:bg-slate-50 hover:text-[#162B4D] transition-all"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-slate-100 text-[#162B4D] flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                      <span>
                        <span className="block font-[800]">Todos los equipos</span>
                        <span className="text-[10px] text-slate-400 font-[500]">Catálogo general completo</span>
                      </span>
                    </Link>
                    <Link
                      href="/renta"
                      onClick={() => setCatalogoOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-[700] text-slate-700 hover:bg-[#264772]/5 hover:text-[#264772] transition-all"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-[#264772]/10 text-[#264772] flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <span>
                        <span className="block font-[800]">Renta de equipos</span>
                        <span className="text-[10px] text-slate-400 font-[500]">Tarifa mensual</span>
                      </span>
                    </Link>
                    <Link
                      href="/venta"
                      onClick={() => setCatalogoOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-[700] text-slate-700 hover:bg-slate-50 hover:text-[#E63C46] transition-all"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-[#E63C46]/10 text-[#E63C46] flex items-center justify-center shrink-0">
                        <BadgeDollarSign className="w-3.5 h-3.5" />
                      </span>
                      <span>
                        <span className="block font-[800]">Venta de equipos</span>
                        <span className="text-[10px] text-slate-400 font-[500]">Compra directa</span>
                      </span>
                    </Link>
                    <Link
                      href="/seguimiento"
                      onClick={() => setCatalogoOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-[700] text-slate-700 hover:bg-[#264772]/10 hover:text-[#264772] transition-all border-t border-slate-100 mt-1 pt-2"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-[#264772] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <span>
                        <span className="block font-[800] text-[#264772]">Rastrear Pedido & Pagos</span>
                        <span className="text-[10px] text-slate-400 font-[500]">Cuentas BCP, BBVA y Yape</span>
                      </span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="/#contacto"
              onClick={() => handleLinkClick('contacto')}
              className={`h-full flex items-center transition-colors relative group ${
                activeSection === 'contacto' ? 'text-[#E63C46]' : 'text-[#1A1A1A] hover:text-[#E63C46]'
              }`}
            >
              <span>Contacto</span>
              <span className={`absolute bottom-0 left-0 h-[3px] bg-[#E63C46] rounded-full transition-all duration-300 ${
                activeSection === 'contacto' ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </a>
          </nav>

          {/* 3. BLOQUE DERECHA: BUSCADOR + ADMIN + CARRITO */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0 ml-auto">
            {/* BUSCADOR (Escritorio) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.querySelector('input') as HTMLInputElement;
                if (input && input.value.trim()) {
                  window.location.href = `/equipos?q=${encodeURIComponent(input.value.trim())}`;
                }
              }}
              className="hidden md:flex items-center relative w-52 xl:w-64"
            >
              <input
                type="text"
                placeholder="Buscar equipo, marca..."
                className="w-full bg-slate-100/90 border border-slate-200 rounded-full py-2 pl-3.5 pr-8 text-xs font-[500] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E63C46] focus:bg-white transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#E63C46] hover:bg-[#C92A36] text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                aria-label="Buscar"
              >
                <Search className="w-3 h-3" />
              </button>
            </form>

            {/* BOTÓN INGRESO ADMIN (SOLO ÍCONO) */}
            <Link
              href="/admin/login"
              title="Panel de Administración"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-[#162B4D] transition-colors border border-slate-200/80 flex items-center justify-center"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* CARRITO INTERACTIVO */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 rounded-full bg-slate-100 hover:bg-[#E63C46]/10 text-slate-700 hover:text-[#E63C46] transition-colors border border-slate-200/80 flex items-center justify-center"
              aria-label="Ver Cotización"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E63C46] text-white text-[10px] font-[800] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalCount}
                </span>
              )}
            </button>

            {/* BOTÓN MENÚ MÓVIL */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-full bg-slate-100 text-slate-700 hover:text-[#E63C46] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[74px] left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] shadow-2xl px-6 py-6 space-y-4 max-h-[calc(100vh-74px)] overflow-y-auto">
          <nav className="flex flex-col gap-2 font-montserrat font-[700] text-[13px] uppercase tracking-wider">
            <a href="/#" onClick={() => { setMobileMenuOpen(false); handleLinkClick('inicio'); }} className="text-slate-800 hover:text-[#E63C46] py-3 border-b border-slate-100 flex items-center justify-between">
              <span>Inicio</span>
            </a>
            <a href="/#nosotros" onClick={() => { setMobileMenuOpen(false); handleLinkClick('nosotros'); }} className="text-slate-800 hover:text-[#E63C46] py-3 border-b border-slate-100 flex items-center justify-between">
              <span>Nosotros</span>
            </a>
            <a href="/#servicios" onClick={() => { setMobileMenuOpen(false); handleLinkClick('servicios'); }} className="text-slate-800 hover:text-[#E63C46] py-3 border-b border-slate-100 flex items-center justify-between">
              <span>Especialidades</span>
            </a>
            <a href="/#catalogo" onClick={() => { setMobileMenuOpen(false); handleLinkClick('catalogo'); }} className="text-slate-800 hover:text-[#E63C46] py-3 border-b border-slate-100 flex items-center justify-between">
              <span>Catálogo</span>
            </a>
            <a href="/#contacto" onClick={() => { setMobileMenuOpen(false); handleLinkClick('contacto'); }} className="text-slate-800 hover:text-[#E63C46] py-3 border-b border-slate-100 flex items-center justify-between">
              <span>Contacto</span>
            </a>
            
            <div className="pt-4">
              <a href="/cotizacion" onClick={() => setMobileMenuOpen(false)} className="bg-[#E63C46] text-white font-[800] py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E63C46]/20">
                <ShoppingCart className="w-4 h-4" />
                <span>Ver Mi Cotización</span>
              </a>
            </div>
          </nav>
        </div>
      )}

      {/* DRAWER LATERAL DE COTIZACIÓN */}
      {cartDrawerOpen && (
        <>
          <div
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />

          <div
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white z-50 shadow-2xl flex flex-col justify-between font-poppins overflow-hidden sm:rounded-l-[24px] transition-transform duration-300 transform translate-x-0 animate-in slide-in-from-right"
          >
            {/* Header Drawer */}
            <div className="px-5 sm:px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-[#E63C46]" />
                  {totalCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E63C46] text-white text-[9px] font-[800] w-4 h-4 rounded-full flex items-center justify-center">
                      {totalCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-spartan font-[800] text-base text-slate-900 leading-none">
                    Resumen de Cotización
                  </h3>
                  <p className="text-[11px] text-slate-500 font-[500] mt-1 truncate">
                    {totalCount === 0
                      ? 'No has agregado equipos aún'
                      : `${totalCount} equipo${totalCount > 1 ? 's' : ''} en tu solicitud`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                aria-label="Cerrar drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Items */}
            <div className="px-5 sm:px-6 py-5 flex-1 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280] space-y-3">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-[500]">No hay equipos agregados a la cotización.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-3 sm:gap-4 min-w-0"
                  >
                    <img
                      src={imagenCompleta(item.imagenUrl)}
                      alt={item.nombre}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-[8px] object-cover bg-white border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-[700] text-[#1A1A1A] line-clamp-1 truncate">{item.nombre}</h4>
                      <span className="text-[10px] font-[700] text-[#E63C46] uppercase tracking-wide">{tipoLabel(item.tipo)}</span>
                      <div className="text-xs font-[800] text-[#1A1A1A] mt-1">
                        S/ {item.precio.toLocaleString()}
                        {item.unidad && <span className="font-[500] text-slate-400"> {item.unidad}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-[#E63C46] transition-colors p-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-[8px] px-1.5 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 hover:text-[#E63C46]">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-[700] px-1.5 min-w-[14px] text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 hover:text-[#E63C46]">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Drawer */}
            {cart.length > 0 && (
              <div className="px-5 sm:px-6 py-5 border-t border-[#E5E7EB] bg-[#F8FAFC] space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal</span>
                    <span className="font-[700] text-[#1A1A1A]">S/ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#1A1A1A] font-[800] text-sm pt-2 border-t border-slate-200">
                    <span>Total Estimado</span>
                    <span className="text-[#E63C46]">S/ {subtotal.toLocaleString('es-PE', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href="/cotizacion"
                    className="w-full bg-[#E63C46] hover:bg-[#C92A36] text-white font-[700] py-3 rounded-[8px] text-xs transition-colors block text-center uppercase tracking-wider shadow-md"
                  >
                    Continuar Cotización
                  </a>
                  <button
                    onClick={clearCart}
                    className="w-full bg-white hover:bg-slate-100 text-[#6B7280] font-[600] py-2.5 rounded-[8px] text-xs transition-colors border border-[#E5E7EB] uppercase tracking-wider"
                  >
                    Vaciar Cotización
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TOAST NOTIFICACIÓN AL AGREGAR AL CARRITO */}
      {addedItemToast && (
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-[#162B4D] text-white p-4 rounded-[18px] shadow-2xl border border-slate-700/60 flex items-center gap-4 max-w-md font-poppins transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="relative shrink-0">
            <img
              src={imagenCompleta(addedItemToast.imagenUrl)}
              alt={addedItemToast.nombre}
              className="w-12 h-12 rounded-[12px] object-cover bg-white border border-white/20"
            />
            <div className="absolute -top-1 -right-1 bg-[#17A34A] text-white rounded-full p-0.5 shadow-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[11px] font-[800] text-[#E63C46] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
              <span>Agregado a la Cotización</span>
            </div>
            <h4 className="text-xs font-[700] text-white leading-snug line-clamp-1 truncate mt-0.5">
              {addedItemToast.nombre}
            </h4>
          </div>

          <button
            onClick={() => setCartDrawerOpen(true)}
            className="px-3 py-1.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-[11px] font-[800] rounded-xl shrink-0 shadow-md transition-all"
          >
            Ver Carrito
          </button>
        </div>
      )}
    </>
  );
}

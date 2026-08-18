'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  LayoutDashboard,
  Package,
  FolderTree,
  ScrollText,
  CalendarClock,
  ClipboardList,
  FileText,
  UserCog,
  LogOut,
  ExternalLink,
  PanelLeft,
  UserCircle2,
} from 'lucide-react';
import { getToken, getStoredUser, clearSession, ROL_LABELS } from '@/lib/api';

interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UsuarioSesion | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/olvide-password' || pathname === '/admin/reset-password';

  useEffect(() => {
    setMounted(true);
    if (isLoginPage) return;

    const validToken = getToken();
    const currentUser = getStoredUser();

    if (!validToken || !currentUser) {
      clearSession();
      setUser(null);
      router.replace('/admin/login');
    } else {
      setUser((prev) => (prev?.id === currentUser.id ? prev : currentUser));
    }
  }, [router, pathname, isLoginPage]);

  // Si estamos en la página de login o recuperación, renderizar directamente
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si aún no se ha montado en el cliente o no hay usuario autenticado, mostrar loader consistente
  if (!mounted || !user || !getToken()) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-[700] text-slate-500 tracking-wider uppercase">
          Verificando sesión...
        </span>
      </div>
    );
  }

  const handleLogout = () => {
    clearSession();
    router.replace('/admin/login');
  };

  // En móvil abre el drawer; en escritorio colapsa/expande la sidebar
  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  const colapsada = sidebarCollapsed;
  // El modo mini (solo íconos) aplica únicamente en escritorio (lg); en móvil
  // el drawer siempre se muestra completo.
  const anchoSidebar = colapsada ? 'lg:w-[76px]' : 'lg:w-64';
  const textoOculto = colapsada ? 'lg:hidden' : '';

  const navItems = [
    { href: '/admin/equipos', label: 'Maestro de Equipos', icon: Package },
    { href: '/admin/alquileres', label: 'Alquileres', icon: CalendarClock },
    { href: '/admin/mantenimiento', label: 'Mantenimiento', icon: ClipboardList },
    { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: FileText },
    { href: '/admin/facturacion', label: 'Facturación', icon: ScrollText },
    { href: '/admin/familias', label: 'Categorías', icon: FolderTree },
    { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
    { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
  ];

  // Solo ADMIN y GERENCIA ven los módulos de administración (Familias, Auditoría, Usuarios)
  const esAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'GERENCIA';
  const MODULOS_ADMIN = ['/admin/familias', '/admin/auditoria', '/admin/usuarios'];
  const puedeVer = (href: string) => !user || esAdmin || !MODULOS_ADMIN.includes(href);

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans antialiased flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#162B4D] text-white flex flex-col transition-all duration-300 ${anchoSidebar} ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* LOGO + TOGGLE */}
        <div className="px-3 py-4 border-b border-white/10">
          <div className={`flex items-center justify-between gap-2 ${colapsada ? 'lg:flex-col lg:justify-center lg:gap-3' : ''}`}>
            <div className={`flex items-center transition-all ${colapsada ? 'lg:w-full lg:justify-center' : ''}`}>
              <div
                className={`bg-white rounded-[12px] shadow-md border border-white/20 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  colapsada ? 'w-10 h-10 p-0.5' : 'w-44 h-12 p-0.5'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/hhtrentlogo.jpg"
                  alt="HHTRENT Logo"
                  className="w-full h-full object-contain scale-[1.38] transform transition-transform"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(false);
                } else {
                  setSidebarCollapsed((c) => !c);
                }
              }}
              title={colapsada ? 'Mostrar menú' : 'Ocultar menú'}
              className="flex shrink-0 p-2 rounded-[10px] text-slate-300/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <PanelLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  colapsada ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden font-sans font-[700] text-[13px] tracking-wide" style={{ fontFamily: 'var(--font-jakarta), var(--font-inter), sans-serif' }}>
          <Link
            href="/admin"
            title="Panel"
            className={`flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all ${
              colapsada ? 'lg:justify-center' : ''
            } ${
              pathname === '/admin'
                ? 'bg-white/10 text-white font-[800]'
                : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className={`${textoOculto} whitespace-nowrap`}>Panel</span>
          </Link>

          {navItems
            .filter((item) => puedeVer(item.href))
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all ${
                    colapsada ? 'lg:justify-center' : ''
                  } ${
                    isActive(item.href)
                      ? 'bg-[#E63C46] text-white font-[800] shadow-lg shadow-[#E63C46]/25'
                      : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`${textoOculto} whitespace-nowrap`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
        </nav>

        {/* USUARIO Y CIERRE */}
        <div className="p-3 border-t border-white/10 space-y-3">
          {user && (
            <div
              className={`flex items-center gap-3 px-2 ${colapsada ? 'lg:justify-center' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-5 h-5 text-slate-300" />
              </div>
              <div className={`${textoOculto} min-w-0`}>
                <p className="text-xs font-[700] truncate">{user.nombre}</p>
                <p className="text-[10px] text-slate-300/80 font-[500]">
                  {ROL_LABELS[user.rol] || user.rol}
                </p>
              </div>
            </div>
          )}
          <div className={`flex gap-2 ${colapsada ? 'lg:flex-col lg:items-center' : ''}`}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Sitio Web"
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-[600] transition-all ${
                colapsada ? 'w-full px-0' : ''
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className={`${textoOculto}`}>Sitio Web</span>
            </a>
            <button
              onClick={handleLogout}
              title="Salir"
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-[#E63C46]/20 hover:bg-[#E63C46]/40 text-[#FF8A92] text-[11px] font-[600] transition-all ${
                colapsada ? 'w-full px-0' : ''
              }`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className={`${textoOculto}`}>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY MÓVIL */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CONTENIDO */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-[padding] duration-300 ${
          colapsada ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

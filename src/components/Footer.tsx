'use client';
import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

/* ===== Iconos de redes sociales (SVG oficiales) ===== */
const base = 'w-4 h-4';
const redes: {
  nombre: string;
  href: string;
  hover: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    nombre: 'Facebook',
    href: 'https://web.facebook.com/hhtsolucionasg',
    hover: 'hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
      </svg>
    ),
  },
  {
    nombre: 'Instagram',
    href: 'https://www.instagram.com/hh.tsoluciona.peru/',
    hover: 'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:border-transparent hover:text-white',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    nombre: 'LinkedIn',
    href: 'https://www.linkedin.com/company/hh-t-soluciona-per%C3%BA-oficial/',
    hover: 'hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
      </svg>
    ),
  },
  {
    nombre: 'YouTube',
    href: 'https://www.youtube.com/@hht-soluciona',
    hover: 'hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    nombre: 'TikTok',
    href: 'https://www.tiktok.com/@hh.tsoluciona.peru',
    hover: 'hover:bg-[#010101] hover:border-[#010101] hover:text-white',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

function RedesSociales() {
  return (
    <div className="flex items-center gap-2.5">
      {redes.map(({ nombre, href, hover, Icon }) => (
        <a
          key={nombre}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Síguenos en ${nombre}`}
          title={nombre}
          className={`p-2.5 rounded-[10px] bg-[#1d385c] border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all duration-300 ${hover}`}
        >
          <Icon className={base} />
        </a>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="contacto" className="bg-[#264772] border-t border-white/10 text-slate-300 text-xs py-20 font-poppins relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Grid de 4 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Columna 1: Empresa */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img
                src="/img/hhtrentlogo.jpg"
                alt="HT RENT"
                className="h-10 w-auto object-contain rounded-lg"
              />
            </div>
            <p className="leading-relaxed text-slate-200 text-xs">
              Especialistas en ingeniería eléctrica aplicada a media tensión y subestaciones eléctricas. Acompañamos el desempeño real de sus sistemas eléctricos.
            </p>

            {/* Redes Sociales */}
            <div className="pt-2">
              <p className="font-spartan font-[700] text-white text-sm mb-3 uppercase tracking-wider">Síguenos</p>
              <RedesSociales />
            </div>
          </div>

          {/* Columna 2: Especialidades */}
          <div>
            <h4 className="font-spartan font-[700] text-white text-sm mb-5 uppercase tracking-wider">Especialidades</h4>
            <ul className="space-y-3 text-slate-300">
              <li><a href="#servicios" className="hover:text-white transition-colors">Media Tensión</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Diagnóstico y Evaluación</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Mantenimiento de Subestaciones</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Calidad de Energía</a></li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div>
            <h4 className="font-spartan font-[700] text-white text-sm mb-5 uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                <span>Av. Colectora Norte Nro. 509, Urb. Parques del Chipe, Piura, Perú</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                <a href="mailto:informes@hhtsoluciona.com.pe" className="break-all hover:text-white transition-colors">
                  informes@hhtsoluciona.com.pe
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                <a href="mailto:cotizaciones@hhtsoluciona.com.pe" className="break-all hover:text-white transition-colors">
                  cotizaciones@hhtsoluciona.com.pe
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#E63C46] shrink-0" />
                <a
                  href="https://wa.me/51920081628"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors"
                >
                  +51 920 081 628
                </a>
                <span className="text-slate-400">·</span>
                <a
                  href="https://wa.me/51968285032"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors"
                >
                  +51 968 285 032
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Boletín */}
          <div>
            <h4 className="font-spartan font-[700] text-white text-sm mb-5 uppercase tracking-wider">Boletín</h4>
            <p className="text-slate-300 text-xs mb-4 leading-relaxed">
              Reciba las últimas novedades del sector de ingeniería y soluciones eléctricas.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Su correo corporativo..."
                className="bg-[#1d385c] border border-white/10 rounded-[10px] px-4 py-2.5 text-xs text-white flex-1 outline-none focus:ring-2 focus:ring-[#E63C46]/20 focus:border-[#E63C46] transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-[#E63C46] hover:bg-[#C92A36] text-white font-[700] px-4 py-2.5 rounded-[10px] text-xs transition-colors flex items-center justify-center shrink-0 shadow-lg shadow-[#E63C46]/15"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Franja final: copyright */}
        <div className="pt-8 mt-16 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-300 text-sm">
          <p>© 2026 HH T-SOLUCIONA SAC Todos los derechos reservados.</p>
        </div>

      </div>
    </footer>
  );
}

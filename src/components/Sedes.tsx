'use client';
import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sedes() {
  return (
    <section id="sedes" className="py-24 bg-white border-t border-slate-100 font-poppins relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* COLUMNA IZQUIERDA: INFORMACIÓN DE CONTACTO */}
          <div className="space-y-8">
            <div>
              <span className="text-[#E63C46] font-[700] text-xs tracking-widest uppercase bg-[#E63C46]/10 px-3.5 py-1.5 rounded-full border border-[#E63C46]/20 inline-block mb-3">
                Nuestra Sede
              </span>
              <h2 className="font-spartan font-[800] text-3xl sm:text-4xl text-slate-900 tracking-tight uppercase leading-none mt-1">
                Sede Central en Piura
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-4 font-spartan font-[500]">
                Desde nuestra sede en Piura brindamos soporte técnico inmediato y despacho de equipos a todo el norte del país, con cobertura para minería e industria.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-[20px] bg-[#f8fafc] border border-slate-200/50 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3.5 rounded-[12px] bg-white border border-slate-100 text-[#E63C46] group-hover:scale-105 transition-transform shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-spartan font-[700] text-slate-800 text-base">Sede Central Piura</h4>
                  <p className="text-slate-600 text-xs mt-0.5 font-spartan font-[500]">Av. Colectora Norte Nro. 509, Urb. Parques del Chipe, Piura, Perú</p>
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-[#f8fafc] border border-slate-200/50 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3.5 rounded-[12px] bg-white border border-slate-100 text-[#233A61] group-hover:scale-105 transition-transform shadow-inner">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-spartan font-[700] text-slate-800 text-base">Central de Atención</h4>
                  <p className="text-slate-600 text-xs mt-0.5 font-spartan font-[500]">
                    <a href="https://wa.me/51920081628" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">+51 920 081 628</a>
                    {' '}|{' '}
                    <a href="https://wa.me/51968285032" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">+51 968 285 032</a>
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-[#f8fafc] border border-slate-200/50 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3.5 rounded-[12px] bg-white border border-slate-100 text-[#162B4D] group-hover:scale-105 transition-transform shadow-inner">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-spartan font-[700] text-slate-800 text-base">Correos de Enlace</h4>
                  <p className="text-slate-600 text-xs mt-0.5 font-spartan font-[500] space-y-0.5">
                    <a href="mailto:informes@hhtsoluciona.com.pe" className="block break-all hover:text-[#E63C46] transition-colors">informes@hhtsoluciona.com.pe</a>
                    <a href="mailto:cotizaciones@hhtsoluciona.com.pe" className="block break-all hover:text-[#E63C46] transition-colors">cotizaciones@hhtsoluciona.com.pe</a>
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-[#f8fafc] border border-slate-200/50 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3.5 rounded-[12px] bg-white border border-slate-100 text-[#233A61] group-hover:scale-105 transition-transform shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-spartan font-[700] text-slate-800 text-base">Disponibilidad Operativa</h4>
                  <p className="text-slate-600 text-xs mt-0.5 font-spartan font-[500]">Lunes a Sábado: 08:00 - 18:00 | Soporte de Emergencia: 24/7</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/51968285032?text=Hola%20HH%20T-Soluciona,%20requiero%20información%20sobre%20sus%20servicios."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-tr from-[#E63C46] to-[#C92A36] hover:from-[#C92A36] hover:to-[#E63C46] text-white font-[700] px-8 py-4 rounded-[12px] text-xs transition-all duration-300 inline-flex items-center gap-2.5 uppercase tracking-wider shadow-lg shadow-[#E63C46]/15"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* COLUMNA DERECHA: MAPA INTERACTIVO / RED LOGÍSTICA */}
          <div className="relative rounded-[24px] overflow-hidden border border-slate-200/50 bg-[#f8fafc] p-8 sm:p-10 min-h-[480px] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-[800] bg-slate-900 text-white uppercase tracking-wider">
                  Red Operativa
                </span>
                <span className="text-xs font-[600] text-[#E63C46] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E63C46] animate-pulse" /> 100% Activa
                </span>
              </div>
              <h3 className="font-spartan font-[800] text-3xl text-slate-800 mt-5">Sede Central Piura</h3>
              <p className="text-slate-600 text-xs mt-1.5 font-spartan font-[500] leading-relaxed">
                Monitoreo y despacho continuo para minería y plantas industriales.
              </p>
              <div className="flex items-start gap-2 mt-3 text-slate-600 text-xs font-spartan font-[500] leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-[#E63C46] shrink-0 mt-0.5" />
                <span>Av. Colectora Norte Nro. 509, Urb. Parques del Chipe, Piura, Perú</span>
              </div>
            </div>

            {/* Mapa de Google embebido */}
            <div className="my-6 h-56 sm:h-64 rounded-[16px] border border-slate-300/50 relative overflow-hidden shadow-sm group">
              <iframe
                src="https://maps.google.com/maps?q=Av.%20Colectora%20Norte%20509%2C%20Urb.%20Parques%20del%20Chipe%2C%20Piura%2C%20Per%C3%BA&z=16&output=embed&hl=es"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Google - HH T-Soluciona, Av. Colectora Norte 509, Piura"
              />
              <a
                href="https://www.google.com/maps/search/?api=1&query=Av.+Colectora+Norte+509,+Piura,+Per%C3%BA"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 bg-[#162B4D]/95 hover:bg-[#E63C46] text-white text-[10px] font-[700] px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Cómo llegar</span>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-[12px] bg-white border border-slate-200/50 text-center shadow-sm">
                <MapPin className="w-4 h-4 text-[#E63C46] mx-auto mb-1.5" />
                <div className="text-slate-800 font-spartan font-[700] text-sm">Piura</div>
                <div className="text-[9px] text-slate-400 uppercase font-[600] tracking-wider mt-0.5">Av. Colectora Norte 509 · Piura, Perú</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

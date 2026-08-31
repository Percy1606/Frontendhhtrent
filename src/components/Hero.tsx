'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';

export default function Hero() {
  return (
    <section id="inicio" className="relative h-auto min-h-[780px] w-full overflow-hidden flex items-center justify-start py-20 lg:py-0 bg-[#264772] font-poppins">
      {/* Imagen Industrial de Fondo */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('/img/Principal.jpg')`,
        }}
      >
        {/* Overlay Oscuro / Gradiente elegante con azul #264772 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A6890]/85 via-[#4A6890]/60 to-transparent" />
      </div>

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[60%] rounded-[24px] p-8 sm:p-12 text-white shadow-2xl border border-white/10 mx-auto lg:mx-0 text-left"
          style={{
            backgroundColor: 'rgba(38, 71, 114, 0.5)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >



          {/* Título Principal */}
          <h1 className="font-spartan font-[800] text-[24px] sm:text-[30px] lg:text-[36px] uppercase text-white leading-[1.12] tracking-tight mb-5">
            LÍDERES EN ALQUILER Y VENTA DE EQUIPOS PARA <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E63C46] to-red-400">PROYECTOS ELÉCTRICOS E INDUSTRIALES</span>
          </h1>

          {/* Descripción */}
          <p className="font-inter font-[400] text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            <strong className="font-[700] text-white">HT RENT</strong> brinda soluciones integrales en maquinaria y equipos especializados, ofreciendo disponibilidad, confiabilidad y soporte técnico para garantizar la continuidad y eficiencia de su operación.
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4">
            <a
              href="https://wa.me/51968285032?text=Hola%20HT%20Rent,%20deseo%20solicitar%20cotización%20inmediata%20de%20equipos"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-[#E63C46] to-[#C92A36] hover:from-[#C92A36] hover:to-[#E63C46] text-white font-montserrat font-[700] px-8 py-4 rounded-[12px] text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-[#E63C46]/25 uppercase tracking-wider text-center transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Cotizar por WhatsApp
            </a>

            <a
              href="#catalogo"
              className="bg-[#264772] hover:bg-[#1d385c] text-white border border-white/20 font-montserrat font-[700] px-8 py-4 rounded-[12px] text-xs sm:text-sm transition-all duration-300 uppercase tracking-wider text-center transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-lg shadow-[#264772]/30"
            >
              <LayoutGrid className="w-4 h-4 text-white" />
              <span>Ver Equipos</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

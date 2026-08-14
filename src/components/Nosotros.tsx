'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Eye } from 'lucide-react';

// Imágenes locales de la sección (carrusel rotativo)
const IMAGENES_NOSOTROS = [
  '/img/Nosotros.png',
  '/img/Nosotros2.png',
  '/img/Nosotros3.png',
];

export default function Nosotros() {
  const [imagenIndex, setImagenIndex] = useState(0);

  // Avance automático cada 4 segundos (imágenes movibles)
  useEffect(() => {
    const t = setInterval(() => {
      setImagenIndex((i) => (i + 1) % IMAGENES_NOSOTROS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="nosotros" className="py-24 bg-white font-poppins relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* COLUMNA IZQUIERDA: DISEÑO VISUAL / IMAGEN CON ANIMACIÓN DE ENTRADA */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-slate-100">
              <AnimatePresence mode="wait">
                <motion.img
                  key={imagenIndex}
                  src={IMAGENES_NOSOTROS[imagenIndex]}
                  alt={`Operaciones de Ingeniería HT RENT ${imagenIndex + 1}`}
                  className="w-full h-[480px] object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#162B4D]/60 to-transparent" />

              {/* Indicadores del carrusel */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {IMAGENES_NOSOTROS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImagenIndex(i)}
                    aria-label={`Imagen ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === imagenIndex ? 'w-6 bg-[#E63C46]' : 'w-2 bg-white/60 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

          </motion.div>

          {/* COLUMNA DERECHA: TEXTO Y PROPUESTA DE VALOR CON ANIMACIÓN DE ENTRADA */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="space-y-8 font-poppins"
          >
            <div>
              <span className="text-[#E63C46] font-[700] text-xs tracking-widest uppercase bg-[#E63C46]/10 px-3.5 py-1.5 rounded-full border border-[#E63C46]/20 inline-block mb-3">
                Sobre Nosotros
              </span>
              <h2 className="font-poppins font-[800] text-3xl sm:text-[42px] text-[#162B4D] leading-[1.15] tracking-tight">
                Garantizamos la <span className="text-[#E63C46]">Continuidad</span> de tus Proyectos
              </h2>
              <p className="font-spartan text-slate-600 text-sm sm:text-base leading-relaxed mt-4 font-[500]">
                En <strong className="font-[800] text-[#162B4D]">HT RENT</strong> brindamos soluciones de alquiler de equipos para proyectos eléctricos e industriales, ofreciendo disponibilidad, confiabilidad y soporte para garantizar la continuidad y eficiencia de cada operación.
              </p>
            </div>

            {/* Grid Misión / Visión */}
            <div className="space-y-6">
              <div className="flex gap-4 p-5 rounded-[20px] bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-white rounded-[12px] border border-slate-200/65 text-[#E63C46] shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-spartan font-[800] text-sm text-[#162B4D] uppercase tracking-wider">Nuestra Misión</h4>
                  <p className="font-spartan text-xs sm:text-sm text-slate-600 mt-1 font-[500] leading-relaxed">
                    Suministrar equipamiento industrial de alta gama con soporte técnico continuo para respaldar las operaciones más críticas del sector minero y energético nacional.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-[20px] bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-white rounded-[12px] border border-slate-200/65 text-[#E63C46] shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-spartan font-[800] text-sm text-[#162B4D] uppercase tracking-wider">Nuestra Visión</h4>
                  <p className="font-spartan text-xs sm:text-sm text-slate-600 mt-1 font-[500] leading-relaxed">
                    Ser reconocidos a nivel nacional como el socio estratégico líder en alquiler de equipos industriales y proyectos de ingeniería eléctrica de alta confiabilidad.
                  </p>
                </div>
              </div>

              {/* Valores corporativos rápidos */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <span className="text-[11px] font-[800] uppercase tracking-widest text-slate-400 mr-2">Valores:</span>
                {['Confiabilidad', 'Disponibilidad', 'Seguridad', 'Soporte 24/7'].map((val, idx) => (
                  <span key={idx} className="bg-slate-100 border border-slate-200/50 text-[#162B4D] font-poppins font-[600] text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

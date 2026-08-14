'use client';
import React from 'react';
import { Wrench, Activity, Zap, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Servicios() {
  const serviciosList = [
    {
      title: "Proyectos Eléctricos en Media Tensión",
      desc: "Diseño, montaje y puesta en servicio de redes eléctricas de media tensión y subestaciones eléctricas para plantas y proyectos mineros.",
      icon: Zap,
      tags: ["DISEÑO", "MONTAJE"],
      bullets: ["Celdas de protección MT", "Pruebas de aislamiento e higrometría"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    },
    {
      title: "Evaluación y Diagnóstico Especializado",
      desc: "Análisis exhaustivo de sistemas eléctricos existentes para identificar fallas potenciales, desbalances y puntos críticos de mejora.",
      icon: ShieldAlert,
      tags: ["DIAGNÓSTICO", "SEGURIDAD"],
      bullets: ["Termografía infrarroja", "Localización de puntos calientes"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    },
    {
      title: "Mantenimiento de Subestaciones",
      desc: "Programas preventivos y predictivos para garantizar la continuidad operativa de transformadores, interruptores y tableros principales.",
      icon: Wrench,
      tags: ["PREVENTIVO", "CORRECTIVO"],
      bullets: ["Pruebas dieléctricas en aceite", "Ajuste de torques y contactos"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    },
    {
      title: "Análisis de Calidad de Energía",
      desc: "Medición y control de perturbaciones, armónicos y fluctuaciones de tensión para evitar daños en equipos electrónicos delicados.",
      icon: Activity,
      tags: ["CALIDAD", "OPTIMIZACIÓN"],
      bullets: ["Medición de armónicos (THD)", "Análisis de factor de potencia"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    },
    {
      title: "Auditorías Energéticas y Consumo",
      desc: "Evaluación del consumo de energía y diseño de estrategias para reducir la facturación eléctrica y huella de carbono industrial.",
      icon: Award,
      tags: ["EFICIENCIA", "AHORRO"],
      bullets: ["Monitoreo de carga crítica", "Optimización de demanda contratada"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    },
    {
      title: "Seguimiento Técnico Continuo",
      desc: "Acompañamiento post-proyecto y monitoreo periódico sin interrumpir las operaciones para certificar la confiabilidad del sistema.",
      icon: FileText,
      tags: ["ACOMPAÑAMIENTO", "24/7"],
      bullets: ["Monitoreo periódico online", "Informes técnicos validados"],
      color: "text-[#E63C46]",
      bg: "hover:border-[#E63C46]/40"
    }
  ];

  return (
    <section id="servicios" className="py-24 bg-[#264772] font-poppins text-white relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E63C46]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-[#E63C46] font-[700] text-xs sm:text-sm tracking-widest uppercase bg-white/10 px-4 py-1.5 rounded-full border border-white/20 inline-block text-white">
            Ingeniería de Alto Impacto
          </span>
          <h2 className="text-4xl sm:text-5xl font-[800] text-white tracking-tight uppercase font-spartan">
            Nuestras Especialidades
          </h2>
          <p className="text-slate-100 text-sm sm:text-base font-[300] max-w-xl mx-auto leading-relaxed">
            Soluciones integrales de mantenimiento, diagnóstico energético y proyectos eléctricos de media tensión bajo estrictas normas de seguridad.
          </p>
        </div>

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosList.map((srv, idx) => {
            const IconComponent = srv.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`p-8 rounded-[24px] bg-[#1d385c]/60 border border-white/15 transition-all duration-300 shadow-xl group backdrop-blur-sm ${srv.bg}`}
              >
                <div className={`w-14 h-14 rounded-[14px] bg-[#162B4D] border border-white/20 ${srv.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex gap-2 mb-4">
                  {srv.tags.map((tg, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md text-[10px] font-[700] bg-slate-900 border border-slate-700/60 text-slate-300 uppercase">
                      {tg}
                    </span>
                  ))}
                </div>

                <h3 className="font-spartan font-[700] text-2xl text-white mb-3 tracking-tight group-hover:text-[#E63C46] transition-colors">
                  {srv.title}
                </h3>
                <p className="font-poppins font-[300] text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  {srv.desc}
                </p>
                
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-700/60">
                  {srv.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#E63C46] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

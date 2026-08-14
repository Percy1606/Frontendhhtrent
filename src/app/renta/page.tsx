import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsappWidget from '@/components/WhatsappWidget';
import CatalogoModalidad from '@/components/CatalogoModalidad';
import { Clock, ShieldCheck, Truck, CalendarClock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Equipos en Renta | HH RENT',
  description:
    'Alquiler de equipos de medición, media tensión e ingeniería en Piura y todo el Perú. Tarifas mensuales con mantenimiento incluido.',
};

export default function RentaPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] font-poppins text-slate-900">
      <Header />

      {/* HERO */}
      <section className="bg-[#264772] pt-24 pb-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-[600] text-slate-300 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Equipos en Renta</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 bg-[#1d385c] border border-white/20 text-white text-[11px] font-[800] uppercase tracking-wider px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-white" />
                Modalidad: Renta / Alquiler
              </span>
              <h1 className="mt-4 font-spartan font-[800] text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.05] tracking-tight">
                Equipos en <span className="text-[#E63C46]">Renta</span> para tu proyecto
              </h1>
              <p className="mt-4 text-sm sm:text-[15px] text-slate-300 font-[400] leading-relaxed max-w-xl">
                Alquila equipos de medición, media tensión y componentes eléctricos con tarifas
                mensuales, mantenimiento preventivo incluido y soporte técnico 24/7.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-[14px] flex items-start gap-2.5">
                  <CalendarClock className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-[800] uppercase tracking-wide">Tarifa mensual</p>
                    <p className="text-[10px] text-slate-300 font-[500] mt-0.5">Precio por período, sin IGV</p>
                  </div>
                </div>
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-[14px] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-[800] uppercase tracking-wide">Certificados</p>
                    <p className="text-[10px] text-slate-300 font-[500] mt-0.5">Equipos calibrados y verificados</p>
                  </div>
                </div>
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-[14px] flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[#E63C46] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-[800] uppercase tracking-wide">Despacho nacional</p>
                    <p className="text-[10px] text-slate-300 font-[500] mt-0.5">Entrega en obra o almacén</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Link
                href="/venta"
                className="block bg-white/5 backdrop-blur border border-white/15 rounded-[20px] p-6 hover:bg-white/10 transition-all group"
              >
                <span className="text-[10px] font-[800] uppercase tracking-widest text-slate-300">
                  ¿Prefieres adquirirlo en propiedad?
                </span>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-spartan font-[800] text-lg text-white group-hover:text-[#E63C46] transition-colors">
                    Ver equipos en Venta →
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#E63C46] text-white text-[10px] font-[800] uppercase">
                    Venta directa
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE RENTA */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <CatalogoModalidad tipo="ALQUILER" otroTipoLabel="Equipos en Venta" otroTipoHref="/venta" />
      </section>

      <Footer />
      <WhatsappWidget />
    </main>
  );
}

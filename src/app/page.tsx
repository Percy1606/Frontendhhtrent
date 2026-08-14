import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Nosotros from '@/components/Nosotros';
import Catalogo from '@/components/Catalogo';
import Servicios from '@/components/Servicios';
import Sedes from '@/components/Sedes';
import Footer from '@/components/Footer';
import WhatsappWidget from '@/components/WhatsappWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfdfd] text-[#1f2937] font-sans">
      <Header />
      <Hero />
      <Nosotros />
      <Catalogo />
      <Servicios />
      <Sedes />
      <Footer />
      <WhatsappWidget />
    </main>
  );
}

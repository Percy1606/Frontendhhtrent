'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

export default function WhatsappWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-poppins">
      {/* Burbuja de ayuda comercial emergente */}
      <AnimatePresence>
        {!isOpen && showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-20 right-0 bg-white text-slate-800 p-3.5 rounded-2xl shadow-xl border border-slate-100 w-64 text-xs font-[600] flex items-center justify-between gap-2"
          >
            <div
              onClick={() => {
                setIsOpen(true);
                setShowBubble(false);
              }}
              className="cursor-pointer"
            >
              <p className="font-[700] text-slate-900 leading-tight">👋 ¿Necesitas cotizar equipos?</p>
              <p className="text-[11px] text-slate-500 font-[400] mt-0.5">Asesoría y entrega inmediata en obra</p>
            </div>
            <button
              onClick={() => setShowBubble(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#E63C46] text-white p-6 relative text-center">
              <h3 className="font-spartan font-[700] text-lg">¿Necesitas ayuda?</h3>
              <p className="text-xs text-red-50/90 mt-1">Haga clic en uno de nuestros representantes</p>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-red-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 bg-slate-50">
              <a
                href="https://wa.me/51968285032?text=Hola%20HH%20T-Soluciona%20Quiero%20Información"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white rounded-xl border border-slate-200/60 hover:border-[#E63C46]/40 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#1F2F52] text-white font-[800] flex items-center justify-center shadow-md">
                      HH
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#E63C46] border-[2px] border-white rounded-full" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-spartan font-[700] text-slate-800 text-sm group-hover:text-[#E63C46] transition-colors">
                      HH T-Soluciona
                    </h4>
                    <p className="text-[11px] text-slate-400 font-light">Atención al Cliente</p>
                    <span className="inline-block bg-red-50 text-[#E63C46] text-[9px] font-[700] px-2 py-0.5 rounded-full mt-1.5 border border-red-100/60">
                      En línea
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full bg-[#E63C46] text-white flex items-center justify-center shadow-xl shadow-[#E63C46]/20 hover:bg-[#C92A36] transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current">
            <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.53-4.942-1.49L7.793 24.41l1.132-3.337a8.955 8.955 0 0 1-1.72-5.272c0-4.955 4.04-8.995 8.997-8.995S25.2 10.845 25.2 15.8c0 4.958-4.04 8.998-8.998 8.998zm0-19.798c-5.96 0-10.8 4.842-10.8 10.8 0 1.964.53 3.898 1.546 5.574L5 27.176l5.974-1.92a10.807 10.807 0 0 0 16.03-9.455c0-5.958-4.842-10.8-10.802-10.8z" fillRule="evenodd"></path>
          </svg>
        )}
      </motion.button>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';

export interface CotizacionItem {
  id: string;
  nombre: string;
  precio: number;
  tipo: string;
  imagenUrl: string;
  cantidad: number;
}

export function useCotizacion() {
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hht_cotizacion_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Items iniciales por defecto para demostración
      setItems([
        {
          id: '1',
          nombre: 'Generador Eléctrico Diesel 500kVA',
          precio: 4500,
          tipo: 'ALQUILER',
          imagenUrl: 'C:/Users/percy/.gemini/antigravity-cli/brain/a0069ce8-c8a4-4303-aef6-0f031d0e3047/generator_50kva_1786032636584.jpg',
          cantidad: 1,
        },
        {
          id: '2',
          nombre: 'Taladro Percutor Heavy Duty 1200W',
          precio: 1250,
          tipo: 'VENTA',
          imagenUrl: 'C:/Users/percy/.gemini/antigravity-cli/brain/a0069ce8-c8a4-4303-aef6-0f031d0e3047/heavy_drill_1200w_1786032659021.jpg',
          cantidad: 2,
        },
      ]);
    }
  }, []);

  const saveItems = (newItems: CotizacionItem[]) => {
    setItems(newItems);
    localStorage.setItem('hht_cotizacion_cart', JSON.stringify(newItems));
  };

  const addItem = (item: Omit<CotizacionItem, 'cantidad'>) => {
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      saveItems(
        items.map((i) => (i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      );
    } else {
      saveItems([...items, { ...item, cantidad: 1 }]);
    }
    setDrawerOpen(true);
  };

  const updateCantidad = (id: string, delta: number) => {
    saveItems(
      items
        .map((i) => {
          if (i.id === id) {
            const next = i.cantidad + delta;
            return next > 0 ? { ...i, cantidad: next } : null;
          }
          return i;
        })
        .filter(Boolean) as CotizacionItem[]
    );
  };

  const removeItem = (id: string) => {
    saveItems(items.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    saveItems([]);
  };

  return {
    items,
    addItem,
    updateCantidad,
    removeItem,
    clearCart,
    drawerOpen,
    setDrawerOpen,
  };
}

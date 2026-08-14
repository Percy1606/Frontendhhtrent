'use client';
import { useState, useEffect } from 'react';

export interface CotizacionItem {
  id: string;
  nombre: string;
  precio: number;
  tipo: string;
  imagenUrl: string;
  cantidad: number;
}

export function useCart() {
  const [cart, setCart] = useState<CotizacionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hht_cotizacion_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      } else {
        // Fallback inicial
        const initialCart: CotizacionItem[] = [
          {
            id: '10',
            nombre: 'Lovato Electric PLC / Relé Programable KINCO 20I/O RS485',
            precio: 980,
            tipo: 'VENTA',
            imagenUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800',
            cantidad: 1,
          },
        ];
        setCart(initialCart);
        localStorage.setItem('hht_cotizacion_cart', JSON.stringify(initialCart));
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('hht_cotizacion_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  }, [cart, isLoaded]);

  const addToCart = (item: {
    id: string;
    nombre: string;
    precio: number | string | null;
    tipo: string;
    imagenUrl: string;
  }) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      const numericPrice = typeof item.precio === 'number' ? item.precio : parseFloat(String(item.precio)) || 0;
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].cantidad += 1;
        return updated;
      }
      return [
        ...prev,
        {
          id: item.id,
          nombre: item.nombre,
          precio: numericPrice,
          tipo: item.tipo,
          imagenUrl: item.imagenUrl,
          cantidad: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CotizacionItem[]
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return { cart, addToCart, updateQuantity, removeItem, clearCart, isLoaded };
}

'use client';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Atrapa errores de sincronización del DOM (ej. "removeChild ... is not a
 * child of this node") que a veces disparan las animaciones de salida de
 * framer-motion bajo React 19, y evita que tumben la página completa.
 */
export default class DomErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    const esDom =
      error instanceof DOMException ||
      msg.includes('removeChild') ||
      msg.includes('NotFoundError');
    return { hasError: esDom };
  }

  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('removeChild') || msg.includes('NotFoundError')) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.props.children;
  }
}

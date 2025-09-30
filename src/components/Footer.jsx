import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm text-center md:text-left">
              Todos los derechos reservados - Diseñado y Desarrollado por Alejandro Trejo y Nova Axis Consulting
            </p>
          </div>
          <a
            href="https://novaaxisconsulting.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            <img
              src="/assets/images/nova-axis-logo.png"
              alt="Nova Axis Consulting"
              className="h-12 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

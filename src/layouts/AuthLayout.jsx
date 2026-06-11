import { Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { AppErrorBoundary } from '../components/errors/AppErrorBoundary';

export const AuthLayout = () => {
  const location = useLocation();

  return (
  <div className="min-h-dvh min-h-[100dvh] flex flex-col lg:flex-row safe-area-x">
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-950 p-12 flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-brand-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-500 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <Logo size="lg" theme="light" />
      </div>
      <div className="relative z-10 space-y-4">
        <h1 className="text-4xl font-bold text-white leading-tight">
          Gestión de ventas
          <span className="text-brand-400"> profesional</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-md">
          Plataforma escalable para controlar ventas, inventario, clientes y más.
          Instalable como aplicación en tu dispositivo.
        </p>
      </div>
      <p className="relative z-10 text-slate-500 text-sm">
        © {new Date().getFullYear()} Tran-Pack
      </p>
    </div>

    <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-slate-50 to-slate-100 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <div className="lg:hidden mb-8 flex justify-center">
          <Logo />
        </div>
        <AppErrorBoundary resetKey={location.pathname} compact showLogo={false}>
          <Outlet />
        </AppErrorBoundary>
      </div>
    </div>
  </div>
  );
};

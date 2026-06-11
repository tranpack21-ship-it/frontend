import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppErrorBoundary } from '../components/errors/AppErrorBoundary';
import { LogOut, Menu, X, Download } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { SidebarNav } from '../components/common/SidebarNav';
import { SidebarUser } from '../components/common/SidebarUser';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAuthRefresh } from '../hooks/useAuthRefresh';
import { ConnectionProvider } from '../context/ConnectionContext';
import { AlertsProvider } from '../context/AlertsContext';
import { ConnectionBanner } from '../components/common/ConnectionBanner';
import { NotificationCenter } from '../components/common/NotificationCenter';
import { useConnection } from '../context/ConnectionContext';

const DashboardShell = () => {
  useAuthRefresh();
  const connection = useConnection();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { canInstallNative, isInstalled, install } = usePWAInstall();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarFooter = () => (
    <div className="shrink-0 p-4 border-t border-slate-700/50 space-y-3">
      {canInstallNative && !isInstalled && (
        <Button
          variant="outline"
          size="sm"
          className="w-full !border-brand-500 !text-brand-400"
          onClick={install}
        >
          <Download className="w-4 h-4" />
          Instalar app
        </Button>
      )}
      <SidebarUser
        nombreUsuario={user?.nombre_usuario}
        rol={user?.rol}
      />
      <Button
        variant="ghost"
        size="sm"
        className="w-full !text-slate-300 hover:!bg-slate-700"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </Button>
    </div>
  );

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-slate-100">
      {/* Sidebar escritorio: fijo, no hace scroll con el contenido */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-slate-800 text-white shadow-xl">
        <div className="shrink-0 p-6 border-b border-slate-700/50">
          <Logo theme="light" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>

      {/* Sidebar móvil: overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-800 text-white shadow-2xl">
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-700/50">
              <Logo size="sm" theme="light" />
              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <SidebarNav onNavigate={closeSidebar} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      {/* Contenido principal: única zona con scroll */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden lg:pl-64">
        <ConnectionBanner
          isOnline={connection.isOnline}
          isOffline={connection.isOffline}
          isChecking={connection.isChecking}
          wasOffline={connection.wasOffline}
          onRefresh={connection.refresh}
          onAcknowledgeReconnected={connection.acknowledgeReconnected}
        />
        <header className="sticky top-0 shrink-0 z-30 flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200 shadow-sm lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="lg:hidden">
            <Logo size="sm" showText={false} />
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Tran-Pack</p>
            <p className="text-xs text-slate-500">Panel de gestión</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationCenter />
            <Badge
              variant={user?.rol === 'admin' ? 'admin' : 'empleado'}
              className="capitalize hidden sm:inline-flex"
            >
              {user?.rol}
            </Badge>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          <AppErrorBoundary resetKey={location.pathname} compact showLogo={false}>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = () => (
  <ConnectionProvider>
    <AlertsProvider>
      <DashboardShell />
    </AlertsProvider>
  </ConnectionProvider>
);

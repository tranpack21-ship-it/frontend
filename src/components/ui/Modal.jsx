import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  footerClassName = '',
  stickyFooter = false,
  zIndex = 50,
  portal = true,
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
  };

  const bodyPaddingClass =
    stickyFooter && footer
      ? 'pb-2 sm:pb-5'
      : !footer
        ? 'pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-5'
        : '';

  const content = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center px-0 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)] sm:pt-4 sm:pb-4"
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-h-full sm:max-h-[min(90vh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] flex flex-col ${sizes[size] || sizes.md} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-semibold text-slate-800 pr-3 leading-tight">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div
          className={`px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto overscroll-contain flex-1 min-h-0 ${bodyPaddingClass}`}
        >
          {children}
        </div>

        {footer && (
          <div
            className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 ${
              stickyFooter
                ? 'sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] sm:shadow-none sm:static rounded-b-2xl'
                : 'rounded-b-2xl sm:rounded-b-2xl'
            } ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (portal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

import React, { useEffect, useState } from 'react';
import { semanticColors, type SemanticColor } from './colorTokens';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

// Alert/Toast use 'error' (reads naturally as a prop name); Badge/Button use
// the shared 'danger' token key. Map once here instead of duplicating colors.
const ALERT_TO_SEMANTIC: Record<AlertVariant, SemanticColor> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number; // in milliseconds
}

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isVisible, onClose]);

  if (!isVisible) return null;

  const variantClasses: Record<AlertVariant, { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: semanticColors[ALERT_TO_SEMANTIC.success].alert,
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bg: semanticColors[ALERT_TO_SEMANTIC.error].alert,
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: semanticColors[ALERT_TO_SEMANTIC.warning].alert,
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bg: semanticColors[ALERT_TO_SEMANTIC.info].alert,
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  return (
    <div className={`border-l-4 p-4 rounded-md ${variantClasses[variant].bg}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{variantClasses[variant].icon}</div>
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className="text-sm">{message}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex bg-transparent rounded-md p-1.5 focus:outline-none`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ToastProps {
  id: string;
  message: string;
  variant?: AlertVariant;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const variantClasses: Record<AlertVariant, string> = {
    success: semanticColors[ALERT_TO_SEMANTIC.success].solid,
    error: semanticColors[ALERT_TO_SEMANTIC.error].solid,
    warning: semanticColors[ALERT_TO_SEMANTIC.warning].solid,
    info: semanticColors[ALERT_TO_SEMANTIC.info].solid,
  };

  return (
    <div className={`${variantClasses[variant]} rounded-lg shadow-premium-lg p-4 mb-3 max-w-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-2">{message}</div>
        <button
          onClick={() => onClose(id)}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

type ToastItem = {
  id: string;
  message: string;
  variant: AlertVariant;
  duration?: number;
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Example usage in your component:
  // const addToast = (message: string, variant: AlertVariant = 'info', duration = 5000) => {
  //   const id = Math.random().toString(36).substring(2, 9);
  //   setToasts([...toasts, { id, message, variant, duration }]);
  // };

  return (
    <div className={`fixed z-50 ${positionClasses[position]} flex flex-col space-y-2 max-w-sm`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  rounded?: boolean;
  size?: 'sm' | 'md';
}> = ({ children, variant = 'primary', rounded = false, size = 'md' }) => {
  const variantClasses: Record<typeof variant, string> = {
    primary: semanticColors.primary.soft,
    secondary: semanticColors.secondary.soft,
    success: semanticColors.success.soft,
    danger: semanticColors.danger.soft,
    warning: semanticColors.warning.soft,
    info: semanticColors.info.soft,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${rounded ? 'rounded-full' : 'rounded'}`}
    >
      {children}
    </span>
  );
};

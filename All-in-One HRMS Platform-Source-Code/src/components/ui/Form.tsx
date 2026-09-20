import React from 'react';
import { semanticColors, type SemanticColor } from './colorTokens';

const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5';
const helperClass = 'mt-1.5 text-[12.5px] text-gray-500';
const errorClass = 'mt-1.5 text-[12.5px] text-danger-600';

const fieldClass = (error?: string) =>
  `block w-full rounded-lg border bg-white px-3 text-[14px] text-ink-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-4 disabled:bg-ivory-100 disabled:text-gray-500 ${
    error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
      : 'border-ivory-400 hover:border-gray-400 focus:border-gold-500 focus:ring-gold-100'
  }`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, type = 'text', error, helperText, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={props.id} className={labelClass}>
          {label}
        </label>
        <input ref={ref} type={type} className={`${fieldClass(error)} h-10`} {...props} />
        {error && <p className={errorClass}>{error}</p>}
        {helperText && !error && <p className={helperClass}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={props.id} className={labelClass}>
          {label}
        </label>
        <select ref={ref} className={`${fieldClass(error)} h-10 pr-8`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className={errorClass}>{error}</p>}
        {helperText && !error && <p className={helperClass}>{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={props.id} className={labelClass}>
          {label}
        </label>
        <textarea ref={ref} className={`${fieldClass(error)} py-2.5 leading-relaxed`} {...props} />
        {error && <p className={errorClass}>{error}</p>}
        {helperText && !error && <p className={helperClass}>{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        <div className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 accent-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            {...props}
          />
          <label htmlFor={props.id} className="ml-2.5 block text-[14px] text-ink-900">
            {label}
          </label>
        </div>
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioGroupProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label, name, options, value, onChange, error
}) => {
  return (
    <div className="mb-4">
      <label className={labelClass}>{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${name}-${option.value}`}
              name={name}
              type="radio"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 border-gray-300 accent-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            />
            <label htmlFor={`${name}-${option.value}`} className="ml-2.5 block text-[14px] text-ink-900">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
};

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  helperText?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label, value, onChange, error, helperText, ...props
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={props.id} className={labelClass}>
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass(error)} h-10 tabular`}
        {...props}
      />
      {error && <p className={errorClass}>{error}</p>}
      {helperText && !error && <p className={helperClass}>{helperText}</p>}
    </div>
  );
};

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'outline'
  | 'ghost-primary'
  | 'ghost-secondary'
  | 'ghost-success'
  | 'ghost-danger'
  | 'ghost-warning'
  | 'ghost-info';

const solidVariant = (color: SemanticColor) => {
  const t = semanticColors[color];
  return `${t.solid} ${t.solidHover} ${t.ring} shadow-premium-sm`;
};

const ghostVariant = (color: SemanticColor) =>
  `bg-transparent ${semanticColors[color].ghostText} ${semanticColors[color].ghostHover} ${semanticColors[color].ring}`;

const variantClasses: Record<ButtonVariant, string> = {
  primary: solidVariant('primary'),
  accent: `bg-gold-500 text-ink-950 hover:bg-gold-400 shadow-premium-sm ${semanticColors.primary.ring}`,
  secondary: solidVariant('secondary'),
  danger: solidVariant('danger'),
  success: solidVariant('success'),
  warning: solidVariant('warning'),
  outline: `bg-white text-ink-900 border border-ivory-400 hover:border-gray-400 hover:bg-ivory-50 shadow-premium-sm ${semanticColors.primary.ring}`,
  'ghost-primary': ghostVariant('primary'),
  'ghost-secondary': ghostVariant('secondary'),
  'ghost-success': ghostVariant('success'),
  'ghost-danger': ghostVariant('danger'),
  'ghost-warning': ghostVariant('warning'),
  'ghost-info': ghostVariant('info'),
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex justify-center items-center gap-1.5 font-medium tracking-[-0.005em] rounded-btn whitespace-nowrap transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none';

  const sizeClasses = {
    sm: 'h-8 px-3 text-[12.5px]',
    md: 'h-9 px-4 text-[13.5px]',
    lg: 'h-10 px-5 text-[14px]',
    icon: 'h-9 w-9 leading-none',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

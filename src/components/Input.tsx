import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary" style={{ marginBottom: '0.5rem' }}>{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border border-border rounded-lg text-text-primary placeholder-text-tertiary bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
            error ? 'border-danger focus:ring-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-danger" style={{ marginTop: '0.5rem' }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;


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
          className={`w-full px-5 py-3.5 border border-border rounded-xl text-text-primary placeholder-text-tertiary bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-sm focus:shadow-lg focus:shadow-primary/10 ${
            error ? 'border-danger focus:ring-danger focus:shadow-danger/10' : ''
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


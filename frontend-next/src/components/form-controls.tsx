'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import './form-controls.css';

/* ---------- Input ---------- */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={`fc-field ${error ? 'fc-error' : ''} ${className}`}>
        <div className="fc-control-wrap">
          <input id={inputId} ref={ref} placeholder=" " className="fc-input" {...props} />
          <label htmlFor={inputId} className="fc-label">{label}</label>
          <fieldset className="fc-outline"><legend><span>{label}</span></legend></fieldset>
        </div>
        {helperText && <span className="fc-helper">{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ---------- Select ---------- */
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  error?: boolean;
  helperText?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className = '', id, children, ...props }, ref) => {
    const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={`fc-field ${error ? 'fc-error' : ''} ${className}`}>
        <div className="fc-control-wrap">
          <select id={selectId} ref={ref} className="fc-select fc-has-value" {...props}>
            {children}
          </select>
          <label htmlFor={selectId} className="fc-label fc-floated">{label}</label>
          <fieldset className="fc-outline"><legend><span>{label}</span></legend></fieldset>
        </div>
        {helperText && <span className="fc-helper">{helperText}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

/* ---------- Textarea ---------- */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: boolean;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const taId = id || `ta-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={`fc-field ${error ? 'fc-error' : ''} ${className}`}>
        <div className="fc-control-wrap">
          <textarea id={taId} ref={ref} rows={rows} placeholder=" " className="fc-textarea" {...props} />
          <label htmlFor={taId} className="fc-label fc-label-top">{label}</label>
          <fieldset className="fc-outline"><legend><span>{label}</span></legend></fieldset>
        </div>
        {helperText && <span className="fc-helper">{helperText}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-navy">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all';

export const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-navy focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all';

export const textareaClass =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all resize-none';

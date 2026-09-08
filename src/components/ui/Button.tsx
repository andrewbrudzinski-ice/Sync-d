import { motion } from 'framer-motion';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/40 hover:from-purple-500 hover:to-violet-500',
  secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15',
  ghost: 'text-white/70 hover:text-white hover:bg-white/10',
  danger: 'bg-red-600/80 text-white hover:bg-red-500 shadow-lg shadow-red-900/30',
  success: 'bg-emerald-600/80 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30',
  outline: 'border border-purple-500/50 text-purple-300 hover:bg-purple-500/10',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  xl: 'px-10 py-5 text-xl rounded-3xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  icon,
  iconRight,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled}
      className={[
        'font-semibold transition-colors duration-150 flex items-center justify-center gap-2 select-none',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...(rest as Record<string, unknown>)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  );
}

import { classNames } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'inquiry' | 'active';
}

const defaultColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-600',
  pending: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-slate-100 text-slate-600',
};

const inquiryColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
};

const activeColors: Record<string, string> = {
  true: 'bg-green-100 text-green-700',
  false: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-600';

  if (variant === 'inquiry') {
    colorClass = inquiryColors[status] || colorClass;
  } else if (variant === 'active') {
    colorClass = activeColors[status] || colorClass;
  } else {
    colorClass = defaultColors[status] || colorClass;
  }

  const label =
    variant === 'active'
      ? status === 'true'
        ? 'Active'
        : 'Inactive'
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass
      )}
    >
      {label}
    </span>
  );
}

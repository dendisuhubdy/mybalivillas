import { classNames } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'indigo' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const colorMap = {
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export default function StatsCard({ label, value, icon: Icon, color, change }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-admin-border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <p
              className={classNames(
                'mt-1 text-sm font-medium',
                change.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {change.isPositive ? '+' : ''}{change.value}%
              <span className="text-slate-400 font-normal"> vs last month</span>
            </p>
          )}
        </div>
        <div className={classNames('h-12 w-12 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

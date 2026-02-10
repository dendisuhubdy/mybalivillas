import { classNames } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-admin-border">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  'px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-admin-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={classNames(
                      'px-6 py-4 text-sm text-slate-700',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

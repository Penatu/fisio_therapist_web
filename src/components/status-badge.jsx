import { cn } from '@/lib/utils';

export function StatusBadge({ status, label, className }) {
  const statusConfig = {
    not_verified: {
      label: 'Belum Diverifikasi',
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500',
    },
    pending: {
      label: 'Menunggu Verifikasi',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      dot: 'bg-yellow-500',
    },
    verified: {
      label: 'Terverifikasi',
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      dot: 'bg-green-500',
    },
    new: {
      label: 'Orderan Baru',
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    processing: {
      label: 'Diproses',
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500',
    },
    completed: {
      label: 'Selesai',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
  };

  const config = statusConfig[status] || {
    label: status || 'Tidak diketahui',
    bg: 'bg-secondary',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium', config.bg, config.text, className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)}></span>
      {label || config.label}
    </div>
  );
}

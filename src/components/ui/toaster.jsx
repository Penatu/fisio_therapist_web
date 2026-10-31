import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const visibleToasts = toasts.filter((item) => item.open);
  const toastKey = visibleToasts.map((item) => item.id).join(',');

  useEffect(() => {
    if (!toastKey) return undefined;

    const timers = toastKey.split(',').map((id) =>
      setTimeout(() => dismiss(id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toastKey, dismiss]);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {visibleToasts.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <div className="min-w-0 flex-1">
            {item.title && (
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            )}
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

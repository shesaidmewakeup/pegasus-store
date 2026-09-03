import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Ошибка загрузки каталога (Supabase недоступен / не настроен).
 * @param {{ error: Error | null }}
 */
export function StoreError({ error }) {
  return (
    <div className="grid justify-items-center gap-4 py-24 text-center text-muted">
      <AlertTriangle size={56} className="text-gold" strokeWidth={1.2} aria-hidden="true" />
      <p className="text-xl text-ink">Каталог временно недоступен</p>
      <p className="max-w-[52ch]">{String(error?.message ?? 'Неизвестная ошибка')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn btn-gold"
      >
        <RefreshCw size={16} aria-hidden="true" />
        Обновить
      </button>
    </div>
  );
}
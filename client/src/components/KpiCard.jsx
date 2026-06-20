import { Link } from 'react-router-dom';

export default function KpiCard({ title, value, subtitle, icon, trend }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-earth-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-earth-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-earth-500">{subtitle}</p>}
          {trend != null && (
            <p
              className={`mt-2 text-xs font-medium ${
                trend > 0 ? 'text-amber-600' : trend < 0 ? 'text-green-600' : 'text-earth-500'
              }`}
            >
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '●'} {Math.abs(trend).toFixed(1)}% önceki sezona göre
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function InsightCard({ insight }) {
  const styles = {
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  const icons = { warning: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`rounded-lg border p-4 ${styles[insight.type] || styles.info}`}>
      <div className="flex gap-3">
        <span className="text-lg">{icons[insight.type] || 'ℹ️'}</span>
        <div>
          <p className="font-semibold">{insight.title}</p>
          <p className="mt-1 text-sm opacity-90">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <div className="mb-4 text-5xl">🌾</div>
      <h3 className="text-lg font-semibold text-earth-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-earth-500">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

import Icon from './Icon';

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon = 'activity', tone = 'indigo' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} className="w-5 h-5" /></div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'Hoàn tất': 'success',
    'Đang xử lý': 'warning',
    'Thất bại': 'danger',
    'Đã thanh toán': 'success',
    'Đã cộng': 'success',
    'Đang hoạt động': 'success',
    'Tạm khóa': 'danger',
    'Đang chờ': 'warning',
  };
  return <span className={`status-badge status-${map[status] || 'neutral'}`}><span className="status-dot" />{status}</span>;
}

export function EmptyState({ icon = 'video', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} className="w-6 h-6" /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function SectionTitle({ title, description, action }) {
  return <div className="section-title"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

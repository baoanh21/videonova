import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const mainLinks = [
  { name: 'Tổng quan', path: '/', icon: 'grid' },
  { name: 'Tạo video', path: '/create', icon: 'sparkles' },
  { name: 'Video của tôi', path: '/videos', icon: 'video' },
  { name: 'Credit & thanh toán', path: '/billing', icon: 'wallet' },
  { name: 'Lịch sử giao dịch', path: '/transactions', icon: 'receipt' },
];

const accountLinks = [
  { name: 'Hồ sơ', path: '/profile', icon: 'user' },
  { name: 'Cài đặt', path: '/settings', icon: 'settings' },
  { name: 'Trợ giúp', path: '/help', icon: 'help' },
];

function NavGroup({ label, links }) {
  return <div className="sidebar-group">
    <p className="sidebar-label">{label}</p>
    <nav>
      {links.map((link) => (
        <NavLink key={link.path} to={link.path} end={link.path === '/'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Icon name={link.icon} className="w-[19px] h-[19px]" />
          <span>{link.name}</span>
        </NavLink>
      ))}
    </nav>
  </div>;
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>V</span><i /></div>
          <div><h1>VIDEONOVA</h1><p>AI Video Studio</p></div>
        </div>
        <NavGroup label="KHÔNG GIAN LÀM VIỆC" links={mainLinks} />
        <NavGroup label="TÀI KHOẢN" links={accountLinks} />

        <div className="sidebar-bottom">
          <div className="credit-widget">
            <div className="credit-top"><span>Credit khả dụng</span><strong>120</strong></div>
            <div className="credit-bar"><i style={{ width: '60%' }} /></div>
            <div className="credit-foot"><span>12 / 20 miễn phí hôm nay</span><NavLink to="/billing">Mua thêm</NavLink></div>
          </div>
          <NavLink to="/login" className="logout-link"><Icon name="logout" className="w-[18px] h-[18px]"/>Đăng xuất</NavLink>
        </div>
      </aside>
    </>
  );
}

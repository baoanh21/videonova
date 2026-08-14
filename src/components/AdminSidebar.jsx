import { NavLink } from 'react-router-dom';
import Icon from './Icon';

export default function AdminSidebar() {
  const links = [
    ['Tổng quan', '/admin', 'grid'],
    ['Người dùng', '/admin/users', 'users'],
    ['Tác vụ video', '/admin/videos', 'video'],
    ['Giao dịch', '/admin/transactions', 'receipt'],
  ];
  return <aside className="admin-sidebar">
    <div className="brand admin-brand"><div className="brand-mark"><span>V</span><i /></div><div><h1>VIDEONOVA</h1><p>Admin Console</p></div></div>
    <p className="sidebar-label">QUẢN TRỊ HỆ THỐNG</p>
    <nav>{links.map(([name,path,icon]) => <NavLink key={path} to={path} end={path==='/admin'} className={({isActive})=>`sidebar-link ${isActive?'active':''}`}><Icon name={icon} className="w-[19px] h-[19px]"/>{name}</NavLink>)}</nav>
    <div className="sidebar-bottom"><NavLink to="/" className="logout-link"><Icon name="home" className="w-[18px] h-[18px]"/>Về giao diện người dùng</NavLink></div>
  </aside>;
}

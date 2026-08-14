import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Icon from './Icon';
export default function AdminLayout(){
  return <div className="admin-shell"><AdminSidebar/><div className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">BẢNG ĐIỀU KHIỂN</span><strong>Quản trị VideoNova</strong></div><div className="topbar-actions"><button className="icon-button"><Icon name="bell" className="w-[19px] h-[19px]"/></button><div className="profile-chip"><div className="avatar admin-avatar">AD</div><div><strong>Quản trị viên</strong><span>Administrator</span></div></div></div></header><main className="admin-content"><Outlet/></main></div></div>;
}

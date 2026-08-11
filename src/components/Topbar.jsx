import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function Topbar({ onMenu }) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Mở menu"><Icon name="menu" /></button>
      <div className="top-search"><Icon name="search" className="w-[18px] h-[18px]" /><span>Tìm video, giao dịch...</span><kbd>⌘ K</kbd></div>
      <div className="topbar-actions">
        <button className="icon-button notification-button" aria-label="Thông báo"><Icon name="bell" className="w-[19px] h-[19px]"/><i /></button>
        <Link className="mini-credit" to="/billing"><Icon name="sparkles" className="w-4 h-4"/><strong>120</strong><span>credit</span></Link>
        <Link to="/profile" className="profile-chip"><div className="avatar">NA</div><div><strong>Nguyễn Văn A</strong><span>Gói miễn phí</span></div><Icon name="chevronDown" className="w-4 h-4"/></Link>
      </div>
    </header>
  );
}

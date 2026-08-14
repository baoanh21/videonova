import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function Topbar({ onMenu }) {
  let userData = { username: 'Người dùng', credits: 0 };
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      userData = JSON.parse(storedUser);
    }
  } catch (e) {}

  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Mở menu"><Icon name="menu" /></button>
      <div className="top-search"><Icon name="search" className="w-[18px] h-[18px]" /><span>Tìm video, giao dịch...</span><kbd>⌘ K</kbd></div>
      <div className="topbar-actions">
        <button className="icon-button notification-button" aria-label="Thông báo"><Icon name="bell" className="w-[19px] h-[19px]"/><i /></button>
        <Link className="mini-credit" to="/billing"><Icon name="sparkles" className="w-4 h-4"/><strong>{userData.credits}</strong><span>credit</span></Link>
        <Link to="/profile" className="profile-chip">
          <div className="avatar">{getAvatarInitials(userData.username)}</div>
          <div><strong>{userData.username}</strong><span>Gói miễn phí</span></div>
          <Icon name="chevronDown" className="w-4 h-4"/>
        </Link>
      </div>
    </header>
  );
}
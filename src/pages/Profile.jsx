import { useState } from 'react';
import Icon from '../components/Icon';
import { PageHeader, SectionTitle } from '../components/UI';

export default function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { id: '', username: '', email: '', phone: '' });
  const [username, setUsername] = useState(user.username || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [message, setMessage] = useState('');

  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!user.id) {
      setMessage('Vui lòng đăng xuất và đăng nhập lại!');
      return;
    }

    try {
      // Call API
      const res = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Cập nhật local storage
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setMessage('Lưu thành công!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('Lỗi cập nhật!');
      }
    } catch (error) {
      setMessage('Lỗi server!');
    }
  };

  return (
    <div className="page-wrap narrow">
      <PageHeader eyebrow="TÀI KHOẢN CÁ NHÂN" title="Hồ sơ của bạn" description="Quản lý thông tin hiển thị và thông tin liên hệ của tài khoản."/>
      
      <section className="panel profile-hero">
        <div className="large-avatar">{getAvatarInitials(user.username)}</div>
        <div>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <span className="profile-tag">Thành viên từ 08/2026</span>
        </div>
        <button className="btn btn-secondary"><Icon name="upload" className="w-4 h-4"/>Đổi ảnh đại diện</button>
      </section>

      <section className="panel form-panel">
        <SectionTitle title="Thông tin cá nhân" description="Thông tin này được dùng để nhận diện tài khoản của bạn."/>
        <div className="form-grid">
          <label>
            <span>Họ và tên</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            <span>Tên hiển thị</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="full-field">
            <span>Địa chỉ email</span>
            <div className="input-icon">
              <Icon name="mail" className="w-[18px] h-[18px]"/>
              <input value={user.email} readOnly />
              <em>ĐÃ XÁC MINH</em>
            </div>
          </label>
          <label>
            <span>Số điện thoại</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Chưa cập nhật"/>
          </label>
          <label>
            <span>Ngôn ngữ</span>
            <div className="fake-select">Tiếng Việt <Icon name="chevronDown" className="w-4 h-4"/></div>
          </label>
        </div>
        
        {message && <div style={{ color: message === 'Lỗi server!' || message === 'Lỗi cập nhật!' || message === 'Vui lòng đăng xuất và đăng nhập lại!' ? '#ef4444' : '#10b981', marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>{message}</div>}
        
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => { setUsername(user.username); setPhone(user.phone || ''); }}>Hủy thay đổi</button>
          <button className="btn btn-primary" onClick={handleSave}>Lưu thông tin</button>
        </div>
      </section>
    </div>
  );
}
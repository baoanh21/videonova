import { useState } from 'react';
import { PageHeader } from '../components/UI';

export default function Billing() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [amount, setAmount] = useState(100);
  const [message, setMessage] = useState('');

  const handleAddCredit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Vui lòng đăng nhập lại!');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/credit/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, description: 'Nạp qua thẻ' })
      });

      if (res.ok) {
        const updatedUser = { ...user, credits: (user.credits || 0) + amount };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('Nạp thành công!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('Lỗi khi nạp credit!');
      }
    } catch (error) {
      setMessage('Lỗi kết nối server!');
    }
  };

  return (
    <div className="page-wrap narrow">
      <PageHeader eyebrow="THANH TOÁN" title="Nạp Credit" description="Mua thêm credit để tạo nhiều video hơn." />
      
      <div className="panel form-panel">
        <div className="form-grid">
          <label>
            <span>Chọn gói Credit</span>
            {/* Sửa màu chữ/nền */}
            <select 
              className="input" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ backgroundColor: '#1a1b26', color: '#fff' }}
            >
              <option value={50} style={{ backgroundColor: '#1a1b26', color: '#fff' }}>50 Credit - 50.000đ</option>
              <option value={100} style={{ backgroundColor: '#1a1b26', color: '#fff' }}>100 Credit - 95.000đ</option>
              <option value={500} style={{ backgroundColor: '#1a1b26', color: '#fff' }}>500 Credit - 450.000đ</option>
            </select>
          </label>
        </div>
        
        {message && <div style={{ color: message.includes('Lỗi') ? '#ef4444' : '#10b981', marginTop: '10px', fontWeight: 'bold' }}>{message}</div>}
        
        <div className="form-actions mt-4">
          <button className="btn btn-primary" onClick={handleAddCredit}>Thanh toán ngay</button>
        </div>
      </div>
    </div>
  );
}
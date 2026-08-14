import { useState, useEffect } from 'react';
import { PageHeader } from '../components/UI';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  // Tự động gọi API khi vào trang
  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setError('Vui lòng đăng nhập.');

      try {
        const res = await fetch('http://localhost:3000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        } else {
          setError('Lỗi tải dữ liệu');
        }
      } catch (err) {
        setError('Lỗi server');
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="page-wrap narrow">
      <PageHeader eyebrow="QUẢN LÝ" title="Lịch sử giao dịch" description="Theo dõi biến động credit của bạn." />
      
      <div className="panel">
        {error ? <p style={{color: '#ef4444'}}>{error}</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '12px 8px' }}>Thời gian</th>
                <th style={{ padding: '12px 8px' }}>Loại</th>
                <th style={{ padding: '12px 8px' }}>Số lượng</th>
                <th style={{ padding: '12px 8px' }}>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '12px 8px' }}>{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px 8px', color: t.type === 'add' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {t.type === 'add' ? '+ Nạp' : '- Trừ'}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{t.amount}</td>
                  <td style={{ padding: '12px 8px' }}>{t.description}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '12px 8px', textAlign: 'center' }}>Chưa có giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
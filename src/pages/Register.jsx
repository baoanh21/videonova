import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi đăng ký');
      }
    } catch (error) {
      alert('Không thể kết nối Server');
    }
  };

  return (
    <div className="flex h-screen bg-dark items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl border border-gray-800 w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white mb-4">Đăng ký</h2>
        <input 
          type="text" 
          placeholder="Tên người dùng" 
          className="bg-[#14171c] border border-gray-800 p-3 rounded-lg text-white outline-none"
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
        <input 
          type="email" 
          placeholder="Email" 
          className="bg-[#14171c] border border-gray-800 p-3 rounded-lg text-white outline-none"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          className="bg-[#14171c] border border-gray-800 p-3 rounded-lg text-white outline-none"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <button type="submit" className="bg-accent py-3 rounded-lg text-white font-bold mt-2">Tạo tài khoản</button>
        <div className="text-gray-400 text-sm mt-2 text-center">
          Đã có tài khoản? <Link to="/login" className="text-accent">Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}
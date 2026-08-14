import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        alert(data.message || 'Lỗi đăng nhập');
      }
    } catch (error) {
      alert('Không thể kết nối Server');
    }
  };

  return (
    <div className="flex h-screen bg-dark items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl border border-gray-800 w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white mb-4">Đăng nhập</h2>
        <input 
          type="email" 
          placeholder="Email" 
          className="bg-[#14171c] border border-gray-800 p-3 rounded-lg text-white outline-none"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          className="bg-[#14171c] border border-gray-800 p-3 rounded-lg text-white outline-none"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-accent py-3 rounded-lg text-white font-bold mt-2">Vào hệ thống</button>
        <div className="text-gray-400 text-sm mt-2 text-center">
          Chưa có tài khoản? <Link to="/register" className="text-accent">Đăng ký</Link>
        </div>
      </form>
    </div>
  );
}
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
export default function NotFound(){return <div className="not-found"><div className="not-found-code">404</div><h1>Không tìm thấy trang</h1><p>Đường dẫn bạn truy cập không tồn tại trong giao diện VideoNova.</p><Link to="/" className="btn btn-primary"><Icon name="home" className="w-4 h-4"/>Về trang tổng quan</Link></div>}

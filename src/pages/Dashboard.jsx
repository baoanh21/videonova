import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { PageHeader, StatCard, StatusBadge, SectionTitle } from '../components/UI';

const recentVideos = [
  { id: 1, title: 'Lái xe đêm Tokyo', status: 'Hoàn tất', meta: '5 giây • 16:9', time: '10 phút trước', thumb: 'thumb-1' },
  { id: 2, title: 'Giới thiệu sản phẩm đại dương', status: 'Hoàn tất', meta: '5 giây • 16:9', time: 'Hôm qua', thumb: 'thumb-2' },
  { id: 3, title: 'Chân dung phong cách Cyberpunk', status: 'Đang xử lý', meta: '5 giây • 9:16', time: '2 phút trước', thumb: 'thumb-3' },
];

export default function Dashboard() {
  return <div className="page-wrap">
    <PageHeader eyebrow="TRUNG TÂM ĐIỀU KHIỂN" title="Chào buổi sáng, Nguyễn Văn A 👋" description="Theo dõi hoạt động, credit và tiến trình tạo video của bạn." action={<Link className="btn btn-primary" to="/create"><Icon name="plus" className="w-4 h-4"/>Tạo video mới</Link>} />

    <div className="stats-grid">
      <StatCard label="Credit khả dụng" value="120" sub="12 credit miễn phí hôm nay" icon="sparkles" tone="indigo" />
      <StatCard label="Video đã tạo" value="24" sub="+6 trong 7 ngày qua" icon="video" tone="cyan" />
      <StatCard label="Đang xử lý" value="2" sub="Dự kiến hoàn tất sớm" icon="clock" tone="amber" />
      <StatCard label="Tỷ lệ thành công" value="96%" sub="23 / 24 video hoàn tất" icon="trend" tone="green" />
    </div>

    <section className="hero-panel">
      <div className="hero-glow hero-glow-a"/><div className="hero-glow hero-glow-b"/>
      <div className="hero-copy">
        <span className="hero-badge"><Icon name="sparkles" className="w-4 h-4"/> AI IMAGE TO VIDEO</span>
        <h2>Biến hình ảnh tĩnh thành<br/><em>video sống động.</em></h2>
        <p>Tải ảnh lên, mô tả chuyển động và để VideoNova tạo video AI chỉ trong vài bước.</p>
        <div className="hero-actions"><Link to="/create" className="btn btn-primary">Bắt đầu tạo video<Icon name="arrowRight" className="w-4 h-4"/></Link><Link to="/help" className="btn btn-ghost">Xem hướng dẫn</Link></div>
      </div>
      <div className="hero-preview">
        <div className="preview-frame">
          <div className="preview-scene"><div className="scene-moon"/><div className="scene-mountain scene-mountain-a"/><div className="scene-mountain scene-mountain-b"/><div className="scene-road"/><span className="preview-chip"><Icon name="play" className="w-4 h-4"/> 00:05</span></div>
        </div>
        <div className="floating-card floating-card-a"><div className="floating-icon"><Icon name="image" className="w-4 h-4"/></div><div><span>Ảnh đầu vào</span><strong>landscape.jpg</strong></div></div>
        <div className="floating-card floating-card-b"><div className="floating-icon success"><Icon name="check" className="w-4 h-4"/></div><div><span>Trạng thái</span><strong>Đã tạo video</strong></div></div>
      </div>
    </section>

    <div className="dashboard-grid">
      <section className="panel recent-panel">
        <SectionTitle title="Video gần đây" description="Các tác vụ mới nhất của bạn" action={<Link to="/videos" className="text-link">Xem tất cả <Icon name="arrowRight" className="w-4 h-4"/></Link>} />
        <div className="recent-list">{recentVideos.map(v => <Link to={`/videos/${v.id}`} className="recent-row" key={v.id}><div className={`video-thumb ${v.thumb}`}><Icon name="play" className="w-5 h-5"/></div><div className="recent-info"><strong>{v.title}</strong><span>{v.meta} • {v.time}</span></div><StatusBadge status={v.status}/><Icon name="arrowRight" className="w-4 h-4 row-arrow"/></Link>)}</div>
      </section>
      <aside className="panel usage-panel">
        <SectionTitle title="Sử dụng hôm nay" description="Credit miễn phí làm mới mỗi ngày"/>
        <div className="usage-ring"><div><strong>12</strong><span>/ 20</span><small>credit đã dùng</small></div></div>
        <div className="usage-details"><div><span>Còn lại hôm nay</span><strong>8 credit</strong></div><div><span>Credit đã mua</span><strong>100 credit</strong></div></div>
        <Link to="/billing" className="btn btn-secondary full">Mua thêm credit</Link>
      </aside>
    </div>
  </div>;
}

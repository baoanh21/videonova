import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { PageHeader, StatusBadge } from '../components/UI';

const videos = [
  { id:1,title:'Lái xe đêm Tokyo',status:'Hoàn tất',meta:'5 giây • 16:9',date:'10/08/2026',thumb:'thumb-1' },
  { id:2,title:'Giới thiệu sản phẩm đại dương',status:'Hoàn tất',meta:'5 giây • 16:9',date:'09/08/2026',thumb:'thumb-2' },
  { id:3,title:'Chân dung phong cách Cyberpunk',status:'Đang xử lý',meta:'5 giây • 9:16',date:'09/08/2026',thumb:'thumb-3' },
  { id:4,title:'Flycam núi rừng buổi sớm',status:'Hoàn tất',meta:'10 giây • 16:9',date:'08/08/2026',thumb:'thumb-4' },
  { id:5,title:'Xoay sản phẩm 360°',status:'Thất bại',meta:'5 giây • 1:1',date:'07/08/2026',thumb:'thumb-5' },
  { id:6,title:'Thành phố trong mưa',status:'Hoàn tất',meta:'5 giây • 16:9',date:'05/08/2026',thumb:'thumb-6' },
];

export default function MyVideos(){
  return <div className="page-wrap"><PageHeader eyebrow="THƯ VIỆN CÁ NHÂN" title="Video của tôi" description="Xem, tải xuống và quản lý toàn bộ video AI bạn đã tạo." action={<Link to="/create" className="btn btn-primary"><Icon name="plus" className="w-4 h-4"/>Tạo video mới</Link>}/>
    <div className="library-toolbar"><div className="tabs">{['Tất cả 24','Hoàn tất 21','Đang xử lý 2','Thất bại 1'].map((x,i)=><button key={x} className={i===0?'active':''}>{x}</button>)}</div><div className="toolbar-right"><div className="search-field"><Icon name="search" className="w-4 h-4"/><span>Tìm kiếm video...</span></div><button className="filter-button">Mới nhất <Icon name="chevronDown" className="w-4 h-4"/></button></div></div>
    <div className="video-grid">{videos.map(v=><article className="video-card" key={v.id}><Link to={`/videos/${v.id}`} className={`video-cover ${v.thumb}`}><div className="cover-actions"><span className="play-circle"><Icon name="play" className="w-5 h-5"/></span></div>{v.status==='Đang xử lý'&&<div className="processing-overlay"><div className="spinner"/><strong>Đang tạo video...</strong><span>68%</span><div className="processing-bar"><i/></div></div>}{v.status==='Thất bại'&&<div className="failed-overlay"><div><Icon name="x" className="w-5 h-5"/></div><span>Tạo video thất bại</span></div>}</Link><div className="video-card-body"><div className="video-title-row"><Link to={`/videos/${v.id}`}>{v.title}</Link><button><Icon name="more" className="w-5 h-5"/></button></div><div className="video-meta-row"><StatusBadge status={v.status}/><span>{v.meta}</span></div><div className="video-card-footer"><span>{v.date}</span><div>{v.status==='Hoàn tất'&&<button title="Tải xuống"><Icon name="download" className="w-4 h-4"/></button>}<button title="Tạo lại"><Icon name="refresh" className="w-4 h-4"/></button></div></div></div></article>)}</div>
    <div className="pagination"><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><span>...</span><button>8</button><button>›</button></div>
  </div>;
}

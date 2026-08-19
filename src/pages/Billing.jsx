import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createCheckout,
  getCreditPackages,
} from '../api/billingApi';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  SectionTitle,
} from '../components/UI';

import {
  useAppData,
} from '../context/AppDataContext';

const plans=[
  {name:'Gói Khởi đầu',credits:100,price:'49.000 ₫',desc:'Phù hợp để trải nghiệm và tạo video ngắn.',unit:'490 ₫ / credit'},
  {name:'Gói Nhà sáng tạo',credits:500,price:'179.000 ₫',desc:'Tối ưu cho nhu cầu sử dụng thường xuyên.',unit:'358 ₫ / credit',featured:true,badge:'TIẾT KIỆM 27%'},
  {name:'Gói Chuyên nghiệp',credits:1200,price:'349.000 ₫',desc:'Dành cho dự án cần số lượng video lớn.',unit:'291 ₫ / credit',badge:'GIÁ TỐT NHẤT'},
];

export default function Billing(){
  const [credits, setCredits] = useState(() => getCreditState());

  useEffect(() => {
    const refresh = () => setCredits(getCreditState());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const handleBuy = (amount) => {
    addPurchasedCredits(amount);
    setCredits(getCreditState());
  };

  const {
  credit,
  refreshCredit,
} = useAppData();

  return <div className="page-wrap"><PageHeader eyebrow="CREDIT & THANH TOÁN" title="Quản lý credit" description="Theo dõi số dư và mua thêm credit khi bạn cần tạo nhiều video hơn."/>
  <div className="credit-overview"><section className="balance-card"><div className="balance-icon"><Icon name="sparkles" className="w-6 h-6"/></div><div><span>Tổng credit khả dụng</span><strong>{credits.available} <small>credit</small></strong><p>Bao gồm {credits.dailyRemaining} credit miễn phí và {credits.purchased} credit đã mua.</p></div><a href="#plans" className="btn btn-light">Mua thêm credit</a></section><section className="daily-card panel"><div className="daily-head"><div><span>Credit miễn phí hôm nay</span><strong>{credits.dailyUsed} <small>/ {credits.dailyTotal}</small></strong></div><div className="daily-icon"><Icon name="clock" className="w-5 h-5"/></div></div><div className="daily-progress"><i style={{width:`${Math.min(100,(credits.dailyUsed/credits.dailyTotal)*100)}%`}}/></div><p>Còn {credits.dailyRemaining} credit • Làm mới lúc 00:00 ngày mai</p></section></div>
  <div id="plans"><SectionTitle title="Chọn gói credit" description="Credit đã mua không hết hạn và được cộng ngay sau khi thanh toán."/></div>
  <div className="plans-grid">{plans.map(p=><article key={p.name} className={`plan-card ${p.featured?'featured':''}`}>{p.badge&&<span className="plan-badge">{p.badge}</span>}<div className="plan-head"><h3>{p.name}</h3><p>{p.desc}</p></div><div className="plan-credit"><strong>{p.credits.toLocaleString('vi-VN')}</strong><span>credit</span></div><div className="plan-price"><strong>{p.price}</strong><span>{p.unit}</span></div><ul><li><Icon name="check" className="w-4 h-4"/>Credit không hết hạn</li><li><Icon name="check" className="w-4 h-4"/>Dùng cho mọi mô hình AI hỗ trợ</li><li><Icon name="check" className="w-4 h-4"/>Cộng vào tài khoản ngay sau thanh toán</li></ul><button onClick={()=>handleBuy(p.credits)} className={`btn full ${p.featured?'btn-primary':'btn-secondary'}`}>Chọn gói này</button></article>)}</div>
  <section className="panel payment-section"><SectionTitle title="Phương thức thanh toán" description="Các phương thức dưới đây là giao diện minh họa cho hệ thống."/><div className="payment-methods"><div className="payment-item selected"><div className="radio"><i/></div><div className="pay-logo bank">BANK</div><div><strong>Chuyển khoản ngân hàng</strong><span>Thanh toán qua mã QR / Internet Banking</span></div></div><div className="payment-item"><div className="radio"/><div className="pay-logo momo">M</div><div><strong>Ví MoMo</strong><span>Thanh toán nhanh qua ứng dụng MoMo</span></div></div><div className="payment-item"><div className="radio"/><div className="pay-logo card"><Icon name="card" className="w-5 h-5"/></div><div><strong>Thẻ ngân hàng</strong><span>Visa, Mastercard, JCB</span></div></div></div></section>
</div>}

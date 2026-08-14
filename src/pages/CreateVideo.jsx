import Icon from '../components/Icon';
import { PageHeader } from '../components/UI';

const SelectCard = ({ label, value, icon }) => <div className="field-card"><span>{label}</span><div><Icon name={icon} className="w-[18px] h-[18px]"/><strong>{value}</strong><Icon name="chevronDown" className="w-4 h-4 field-chevron"/></div></div>;

export default function CreateVideo() {
  return <div className="page-wrap">
    <PageHeader eyebrow="AI IMAGE TO VIDEO" title="Tạo video mới" description="Biến một hình ảnh thành video AI theo phong cách và chuyển động bạn mong muốn." />
    <div className="creator-grid">
      <div className="creator-main">
        <section className="panel step-panel">
          <div className="step-heading"><span className="step-number">01</span><div><h2>Chọn hình ảnh đầu vào</h2><p>Ảnh rõ nét, đúng chủ thể sẽ giúp video ổn định hơn.</p></div></div>
          <div className="upload-zone"><div className="upload-icon"><Icon name="upload" className="w-6 h-6"/></div><h3>Kéo thả ảnh vào đây</h3><p>hoặc <button>chọn ảnh từ thiết bị</button></p><small>PNG, JPG, WEBP • tối đa 10 MB • tối thiểu 512 × 512 px</small></div>
          <div className="upload-note"><Icon name="sparkles" className="w-4 h-4"/><span>Mẹo: Ảnh có chủ thể rõ, đủ sáng và ít vật thể chồng lấp thường cho kết quả tốt hơn.</span></div>
        </section>

        <section className="panel step-panel">
          <div className="step-heading"><span className="step-number">02</span><div><h2>Mô tả chuyển động</h2><p>Cho AI biết chủ thể, camera và bối cảnh nên chuyển động như thế nào.</p></div></div>
          <div className="prompt-box"><textarea placeholder="Ví dụ: Camera tiến chậm về phía trước, nhân vật khẽ quay đầu nhìn sang phải, tóc chuyển động nhẹ theo gió, ánh đèn neon phản chiếu trên mặt đường..."/><div className="prompt-footer"><button className="prompt-helper"><Icon name="sparkles" className="w-4 h-4"/>Gợi ý prompt</button><span>0 / 500</span></div></div>
          <div className="prompt-tags"><span>Gợi ý nhanh:</span>{['Camera zoom chậm','Chuyển động tự nhiên','Ánh sáng điện ảnh','Giữ khuôn mặt ổn định'].map(t=><button key={t}>{t}</button>)}</div>
        </section>

        <section className="panel step-panel">
          <div className="step-heading"><span className="step-number">03</span><div><h2>Thiết lập video</h2><p>Tùy chỉnh video đầu ra trước khi gửi tác vụ.</p></div></div>
          <div className="settings-grid"><SelectCard label="Mô hình AI" value="Wan 2.1" icon="sparkles"/><SelectCard label="Thời lượng" value="5 giây" icon="clock"/><SelectCard label="Tỷ lệ khung hình" value="16:9" icon="video"/><SelectCard label="Phong cách" value="Điện ảnh" icon="image"/></div>
          <div className="advanced-row"><div><strong>Tăng cường chất lượng</strong><span>Ưu tiên độ chi tiết và chuyển động ổn định hơn</span></div><div className="toggle on"><i/></div></div>
        </section>
      </div>

      <aside className="creator-side">
        <section className="panel preview-panel sticky-panel">
          <div className="preview-title"><h2>Xem trước tác vụ</h2><span>BẢN NHÁP</span></div>
          <div className="empty-preview"><div><Icon name="image" className="w-7 h-7"/></div><strong>Chưa có hình ảnh</strong><span>Ảnh bạn chọn sẽ xuất hiện tại đây.</span></div>
          <div className="summary-list"><div><span>Mô hình</span><strong>Wan 2.1</strong></div><div><span>Thời lượng</span><strong>5 giây</strong></div><div><span>Tỷ lệ</span><strong>16:9</strong></div><div><span>Chất lượng</span><strong>Tiêu chuẩn+</strong></div></div>
          <div className="cost-box"><div><span>Chi phí dự kiến</span><strong>10 <small>credit</small></strong></div><div className="balance-line"><span>Số dư hiện tại</span><strong>120 credit</strong></div></div>
          <button className="btn btn-primary full large"><Icon name="sparkles" className="w-4 h-4"/>Tạo video</button>
          <p className="microcopy">Bằng cách tiếp tục, bạn đồng ý sử dụng credit cho tác vụ này.</p>
        </section>
      </aside>
    </div>
  </div>;
}

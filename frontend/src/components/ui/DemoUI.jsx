import { useState } from 'react'
import { AlertCircle, ArrowRight, Check, CircleHelp, ExternalLink, Info, Search, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from './Button.jsx'
import Card from './Card.jsx'
import Modal, { ModalActions } from './Modal.jsx'
import './DemoUI.scss'

function DemoUI() {
  const [modalOpen, setModalOpen] = useState(false)

  const showLoadingToast = () => {
    const id = toast.loading('Đang lưu thay đổi...')
    window.setTimeout(() => toast.success('Đã lưu thành công', { id }), 1200)
  }

  return (
    <main className="ui-demo">
      <div className="ui-demo__intro">
        <p className="ui-demo__eyebrow">Chạm Sắc Việt · UI kit</p>
        <h1>Những mảnh ghép<br />của trải nghiệm.</h1>
        <p>Bộ component nền tảng sử dụng bảng màu thương hiệu, typography có sẵn và các trạng thái tương tác phổ biến.</p>
      </div>

      <section className="ui-demo__section" aria-labelledby="button-heading">
        <h2 id="button-heading">Button · đầy đủ trạng thái</h2>
        <div className="ui-demo__button-row">
          <Button icon={<Sparkles size={18} />}>Khám phá ngay</Button>
          <Button variant="secondary" icon={<ArrowRight size={18} />} iconPosition="right">Xem thêm</Button>
          <Button variant="accent" icon={<Check size={18} />}>Đã chọn</Button>
          <Button variant="danger">Xóa nội dung</Button>
        </div>
        <div className="ui-demo__button-row">
          <Button variant="ghost" size="sm">Ghost / nhỏ</Button>
          <Button loading>Đang gửi</Button>
          <Button disabled>Đang tắt</Button>
          <Button variant="secondary" size="lg" icon={<ExternalLink size={18} />}>Mở liên kết</Button>
        </div>
      </section>

      <section className="ui-demo__section" aria-labelledby="text-heading">
        <h2 id="text-heading">Typography · title, subtitle & link</h2>
        <div className="ui-demo__type-samples">
          <p className="ui-demo__title-sample">Title / Tiêu đề chính</p>
          <p className="ui-demo__subtitle-sample">Subtitle / Tiêu đề phụ giúp giải thích ngắn gọn nội dung.</p>
          <p className="ui-demo__body-sample">Body text dùng Be Vietnam Pro để dễ đọc. <a href="#text-heading">Link có underline khi hover</a> và màu magenta của thương hiệu.</p>
          <p className="ui-demo__caption-sample">Caption / Chú thích nhỏ</p>
        </div>
      </section>

      <section className="ui-demo__section" aria-labelledby="toast-heading">
        <h2 id="toast-heading">Toast · phản hồi tức thời</h2>
        <div className="ui-demo__button-row">
          <Button variant="secondary" icon={<Check size={18} />} onClick={() => toast.success('Thao tác thành công')}>Success</Button>
          <Button variant="secondary" icon={<Info size={18} />} onClick={() => toast('Thông tin mới đã sẵn sàng')}>Info</Button>
          <Button variant="accent" icon={<AlertCircle size={18} />} onClick={() => toast.error('Không thể hoàn tất thao tác')}>Error</Button>
          <Button variant="ghost" onClick={() => toast('Vui lòng kiểm tra lại dữ liệu')}>Warning</Button>
          <Button onClick={showLoadingToast}>Loading → success</Button>
        </div>
      </section>

      <section className="ui-demo__section" aria-labelledby="placeholder-heading">
        <h2 id="placeholder-heading">Placeholder · có icon</h2>
        <div className="ui-demo__placeholder-grid">
          <div className="ui-demo__placeholder"><Search size={22} aria-hidden="true" /><span>Tìm kiếm nội dung...</span></div>
          <div className="ui-demo__placeholder ui-demo__placeholder--empty"><CircleHelp size={28} aria-hidden="true" /><strong>Chưa có dữ liệu</strong><span>Thông tin sẽ xuất hiện ở đây.</span></div>
        </div>
      </section>

      <section className="ui-demo__section" aria-labelledby="input-heading">
        <h2 id="input-heading">Input · các loại trường dữ liệu</h2>
        <form className="ui-demo__inputs" onSubmit={(event) => event.preventDefault()}>
          <label>Họ và tên<input type="text" placeholder="Nhập họ và tên" /></label>
          <label>Email<input type="email" placeholder="name@example.com" /></label>
          <label>Mật khẩu<input type="password" placeholder="Tối thiểu 8 ký tự" /></label>
          <label>Số lượng<input type="number" min="0" placeholder="0" /></label>
          <label>Ngày tham gia<input type="date" /></label>
          <label>Danh mục<select defaultValue=""><option value="" disabled>Chọn danh mục</option><option>Di sản</option><option>Văn hóa</option></select></label>
          <label className="ui-demo__input-wide">Tin nhắn<textarea rows="4" placeholder="Nhập nội dung của bạn..." /></label>
          <div className="ui-demo__choice-group" role="group" aria-label="Tùy chọn hiển thị">
            <span className="ui-demo__choice-label">Tùy chọn</span>
            <label className="ui-demo__choice"><input type="checkbox" defaultChecked /> Nhận thông báo</label>
            <label className="ui-demo__choice"><input type="radio" name="demo-choice" defaultChecked /> Công khai</label>
            <label className="ui-demo__choice"><input type="radio" name="demo-choice" /> Riêng tư</label>
          </div>
          <label className="ui-demo__input-wide">Trạng thái lỗi<input className="ui-demo__input--error" aria-invalid="true" defaultValue="Nội dung chưa hợp lệ" /><span className="ui-demo__error-message">Vui lòng kiểm tra lại trường này.</span></label>
          <label>Trường disabled<input disabled value="Không thể chỉnh sửa" readOnly /></label>
        </form>
      </section>

      <section className="ui-demo__section" aria-labelledby="card-heading">
        <h2 id="card-heading">Card · nội dung & trạng thái</h2>
        <div className="ui-demo__cards">
          <Card eyebrow="Nổi bật" title="Sắc màu di sản" description="Một card có màu nhấn magenta và hành động rõ ràng." featured actions={<Button variant="accent" size="sm">Khám phá</Button>}>
            <p className="ui-demo__card-copy">Thiết kế cân bằng giữa mảng màu, đường viền và khoảng thở.</p>
          </Card>
          <Card title="Gửi thành công" description="Trạng thái hoàn tất với tín hiệu turquoise." status="success">
            <p className="ui-demo__card-copy">Thông tin của bạn đã được ghi nhận.</p>
          </Card>
          <Card title="Có lỗi xảy ra" description="Trạng thái lỗi dùng màu đỏ thương hiệu." status="error">
            <p className="ui-demo__card-copy">Vui lòng kiểm tra lại dữ liệu và thử lại.</p>
          </Card>
        </div>
      </section>

      <section className="ui-demo__section" aria-labelledby="modal-heading">
        <h2 id="modal-heading">Modal · xác nhận hành động</h2>
        <Button onClick={() => setModalOpen(true)} icon={<ExternalLink size={18} />}>Mở modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Sẵn sàng khám phá?"
          description="Bạn có thể đóng bằng nút X, nút Hủy hoặc phím Escape."
          actions={<ModalActions onCancel={() => setModalOpen(false)} onConfirm={() => setModalOpen(false)} confirmLabel="Tiếp tục" />}
        >
          <p className="ui-demo__modal-note">Modal có lớp nền phủ, focus vào nút đóng, click ra ngoài để đóng và các vùng dành cho nội dung dài hơn.</p>
        </Modal>
      </section>
    </main>
  )
}

export default DemoUI

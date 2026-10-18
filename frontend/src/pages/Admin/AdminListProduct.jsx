import { useState } from 'react'
import { AlertCircle, Archive, Boxes, CircleDollarSign, FilePlus2, Package, PackageX, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import './AdminListProduct.scss'

const initialForm = { name: '', description: '', price: '', stock: '', images: '', status: 'inactive' }
const statusLabels = { active: 'Đang bán', inactive: 'Ngừng bán', sold_out: 'Hết hàng' }

function ProductForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const price = Number(form.price)
    const stock = Number(form.stock)
    const images = form.images.split('\n').map((image) => image.trim()).filter(Boolean)

    if (form.name.trim().length < 2) nextErrors.name = 'Tên sản phẩm cần có ít nhất 2 ký tự.'
    if (!form.price.trim() || !Number.isSafeInteger(price) || price < 0) nextErrors.price = 'Nhập giá là số nguyên không âm.'
    if (!form.stock.trim() || !Number.isSafeInteger(stock) || stock < 0) nextErrors.stock = 'Nhập tồn kho là số nguyên không âm.'
    if (images.some((image) => !/^https:\/\//i.test(image))) nextErrors.images = 'Mỗi ảnh cần là một URL HTTPS hợp lệ.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Vui lòng kiểm tra lại thông tin sản phẩm.')
      return
    }

    onSubmit()
  }

  return (
    <form className="admin-product-form" onSubmit={submit} noValidate>
      <div className="admin-product-form__grid">
        <Field label="Tên sản phẩm" error={errors.name}>
          <Input name="name" value={form.name} onChange={updateField} placeholder="Ví dụ: Sổ tay hành trình di sản Việt" required />
        </Field>
        <Field label="Trạng thái">
          <select className="admin-product-form__select" name="status" value={form.status} onChange={updateField}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Giá bán (VND)" error={errors.price}>
          <Input name="price" type="number" min="0" step="1" value={form.price} onChange={updateField} placeholder="89000" required />
        </Field>
        <Field label="Số lượng trong kho" error={errors.stock}>
          <Input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} placeholder="25" required />
        </Field>
        <Field className="admin-product-form__full" label="Mô tả chi tiết">
          <textarea className="ui-input admin-product-form__textarea" name="description" value={form.description} onChange={updateField} maxLength={5000} placeholder="Thông tin giới thiệu sản phẩm (không bắt buộc)" />
        </Field>
        <Field className="admin-product-form__full" label="Ảnh sản phẩm · mỗi URL một dòng" error={errors.images}>
          <textarea className="ui-input admin-product-form__textarea" name="images" value={form.images} onChange={updateField} placeholder="https://example.com/product-image.webp" />
        </Field>
      </div>
      <div className="admin-product-form__notice" role="note"><AlertCircle size={17} aria-hidden="true" /><span>Form đã theo model sản phẩm. Backend hiện chưa có API tạo sản phẩm nên dữ liệu chưa thể lưu.</span></div>
      <div className="admin-product-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Đóng</Button>
        <Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Lưu sản phẩm</Button>
      </div>
    </form>
  )
}

function Field({ label, error, className = '', children }) {
  return <label className={`admin-product-form__field ${className}`}><span>{label}</span>{children}{error && <small className="admin-product-form__error">{error}</small>}</label>
}

function AdminListProduct() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const notifyUnavailable = () => toast('Chức năng lưu sản phẩm sẽ hoạt động khi backend có API quản lý sản phẩm.')

  return (
    <div className="admin-product-page">
      <header className="admin-product-page__hero">
        <div>
          <p className="admin-product-page__eyebrow"><Archive size={16} aria-hidden="true" /> VẬN HÀNH CỬA HÀNG</p>
          <h1>Sản phẩm</h1>
          <p className="admin-product-page__lead">Quản lý danh mục sản phẩm, giá bán, tồn kho và trạng thái kinh doanh.</p>
        </div>
        <Button icon={<FilePlus2 size={17} aria-hidden="true" />} onClick={() => setIsFormOpen(true)}>Thêm sản phẩm</Button>
      </header>

      <div className="admin-product-page__meta">
        <span><Package size={16} aria-hidden="true" /> Danh sách sản phẩm trong hệ thống</span>
        <small>0 sản phẩm</small>
      </div>

      <section className="admin-product-page__stats" aria-label="Tổng quan sản phẩm">
        <Card className="admin-product-page__stat"><Boxes size={20} aria-hidden="true" /><span><small>Tổng sản phẩm</small><strong>0</strong></span></Card>
        <Card className="admin-product-page__stat admin-product-page__stat--gold"><CircleDollarSign size={20} aria-hidden="true" /><span><small>Đang kinh doanh</small><strong>0</strong></span></Card>
        <Card className="admin-product-page__stat admin-product-page__stat--turquoise"><PackageX size={20} aria-hidden="true" /><span><small>Sản phẩm hết hàng</small><strong>0</strong></span></Card>
      </section>

      <Card className="admin-product-page__card">
        <div className="admin-product-page__toolbar">
          <div className="admin-product-page__summary"><strong>0</strong><span>sản phẩm</span></div>
          <div className="admin-product-page__filters">
            <label className="admin-product-page__search"><Search size={17} aria-hidden="true" /><Input placeholder="Tìm tên sản phẩm" aria-label="Tìm tên sản phẩm" disabled /></label>
            <label className="admin-product-page__select"><span>Trạng thái</span><select aria-label="Lọc trạng thái sản phẩm" disabled><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </div>
        <div className="admin-product-page__state" role="status">
          <Archive size={30} aria-hidden="true" />
          <strong>Chưa có dữ liệu sản phẩm</strong>
          <p>Model sản phẩm đã có, nhưng backend chưa đăng ký API đọc và quản lý sản phẩm. Khi API sẵn sàng, danh sách sẽ hiển thị tại đây.</p>
          <Button variant="secondary" size="sm" icon={<Plus size={15} aria-hidden="true" />} onClick={() => setIsFormOpen(true)}>Thêm sản phẩm</Button>
        </div>
      </Card>

      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)} title="Thêm sản phẩm" description="Nhập thông tin theo model sản phẩm của hệ thống." size="lg">
        <ProductForm onCancel={() => setIsFormOpen(false)} onSubmit={notifyUnavailable} />
      </Modal>
    </div>
  )
}

export default AdminListProduct

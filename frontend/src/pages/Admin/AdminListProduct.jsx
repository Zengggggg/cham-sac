import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Archive, Boxes, CircleDollarSign, Eye, EyeOff, FilePlus2, ImageIcon, ImagePlus, Package, PackageX, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import {
  createAdminProduct,
  createProductImageUpload,
  getAdminProduct,
  listAdminProducts,
  updateAdminProduct,
  uploadProductImageToR2,
} from '../../services/adminService.js'
import './AdminListProduct.scss'

const initialForm = { name: '', description: '', price: '', stock: '', status: 'inactive' }
const statusLabels = { active: 'Đang bán', inactive: 'Ngừng bán', sold_out: 'Hết hàng' }
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const maxImageBytes = 5 * 1024 * 1024
const maxProductImages = 8

const formatMoney = (value) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
const isVideoSource = (src) => /\.(mp4|webm|mov)(?:\?.*)?$/i.test(String(src || ''))

const getDescriptionRows = (description) => String(description || '')
  .split(/\r?\n+/)
  .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
  .filter(Boolean)
  .map((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0 && separatorIndex < 80) {
      return { label: line.slice(0, separatorIndex).trim(), value: line.slice(separatorIndex + 1).trim() }
    }
    return { label: 'Mô tả', value: line }
  })

function ProductImage({ src, alt, className = '' }) {
  const [failedSrc, setFailedSrc] = useState('')

  if (!src || failedSrc === src) {
    return <div className={`admin-product-image admin-product-image--empty ${className}`} role="img" aria-label={`Chưa có ảnh cho ${alt}`}><ImageIcon size={24} aria-hidden="true" /></div>
  }

  return <img className={`admin-product-image ${className}`} src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
}

function ProductMedia({ src, alt, className = '' }) {
  if (isVideoSource(src)) {
    return (
      <video className={`admin-product-image ${className}`} controls preload="metadata" aria-label={alt}>
        <source src={src} />
        Trình duyệt không hỗ trợ video sản phẩm.
      </video>
    )
  }
  return <ProductImage src={src} alt={alt} className={className} />
}

function ProductDetailContent({ product, loading, error }) {
  if (loading) return <div className="admin-product-detail__state" role="status">Đang tải chi tiết sản phẩm...</div>
  if (error) return <div className="admin-product-detail__state" role="alert">{error}</div>
  if (!product) return null

  return (
    <div className="admin-product-detail">
      <div className="admin-product-detail__gallery">
        {(product.images || []).length ? product.images.map((image, index) => (
          <ProductMedia key={image} src={image} alt={`${product.name} - phương tiện ${index + 1}`} className="admin-product-detail__image" />
        )) : <ProductImage src="" alt={product.name} className="admin-product-detail__image" />}
      </div>
      <div className="admin-product-detail__info">
        <span className={`admin-product-detail__status admin-product-detail__status--${product.status}`}>{statusLabels[product.status]}</span>
        <h3>{product.name}</h3>
        <dl>
          <div><dt>Giá bán</dt><dd>{formatMoney(product.price)}</dd></div>
          <div><dt>Tồn kho</dt><dd>{product.stock}</dd></div>
          <div><dt>Cập nhật lần cuối</dt><dd>{product.updatedAt ? new Date(product.updatedAt).toLocaleString('vi-VN') : '—'}</dd></div>
        </dl>
      </div>
      <div className="admin-product-detail__description">
        <strong>Mô tả sản phẩm</strong>
        {getDescriptionRows(product.description).length ? (
          <table>
            <tbody>
              {getDescriptionRows(product.description).map((row, index) => (
                <tr key={`${row.label}-${index}`}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>Sản phẩm chưa có mô tả.</p>}
      </div>
    </div>
  )
}

function ProductForm({ initialProduct = null, onCancel, onSubmit, loading }) {
  const [form, setForm] = useState(() => initialProduct ? {
    name: initialProduct.name || '',
    description: initialProduct.description || '',
    price: String(initialProduct.price ?? ''),
    stock: String(initialProduct.stock ?? ''),
    status: initialProduct.status || 'inactive',
  } : initialForm)
  const [imageFiles, setImageFiles] = useState(() => (initialProduct?.images || []).map((url, index) => ({
    id: index + 1,
    file: null,
    previewUrl: url,
    publicUrl: url,
  })))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [errors, setErrors] = useState({})
  const previewUrls = useRef(new Set())
  const nextImageId = useRef(0)

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const addImages = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selectedFiles.length) return

    if (imageFiles.length + selectedFiles.length > maxProductImages) {
      setErrors((current) => ({ ...current, images: `Mỗi sản phẩm được tải tối đa ${maxProductImages} ảnh.` }))
      return
    }

    const invalidType = selectedFiles.find((file) => !acceptedImageTypes.has(file.type))
    if (invalidType) {
      setErrors((current) => ({ ...current, images: 'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc AVIF.' }))
      return
    }

    const invalidSize = selectedFiles.find((file) => file.size <= 0 || file.size > maxImageBytes)
    if (invalidSize) {
      setErrors((current) => ({ ...current, images: 'Mỗi ảnh phải lớn hơn 0 và không quá 5 MB.' }))
      return
    }

    const entries = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      nextImageId.current += 1
      return { id: nextImageId.current, file, previewUrl, publicUrl: '' }
    })
    setImageFiles((current) => [...current, ...entries])
    setErrors((current) => ({ ...current, images: '' }))
  }

  const removeImage = (imageId) => {
    setImageFiles((current) => {
      const removed = current.find((image) => image.id === imageId)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
        previewUrls.current.delete(removed.previewUrl)
      }
      return current.filter((image) => image.id !== imageId)
    })
    setErrors((current) => ({ ...current, images: '' }))
  }

  const uploadImages = async () => {
    const imageUrls = []
    for (let index = 0; index < imageFiles.length; index += 1) {
      const image = imageFiles[index]
      if (image.publicUrl) {
        imageUrls.push(image.publicUrl)
        continue
      }

      setUploadMessage(`Đang chuẩn bị ảnh ${index + 1}/${imageFiles.length}...`)
      const response = await createProductImageUpload(image.file)
      const upload = response.data?.upload
      if (!upload?.uploadUrl || !upload?.publicUrl) {
        throw new Error('Backend không trả về thông tin tải ảnh hợp lệ.')
      }
      const publicUrl = await uploadProductImageToR2(image.file, upload)
      imageUrls.push(publicUrl)
      setImageFiles((current) => current.map((item) => (
        item.id === image.id ? { ...item, publicUrl } : item
      )))
    }
    return imageUrls
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (form.name.trim().length < 2) nextErrors.name = 'Tên sản phẩm cần có ít nhất 2 ký tự.'
    if (!form.price.trim() || !Number.isSafeInteger(price) || price < 0) nextErrors.price = 'Nhập giá là số nguyên không âm.'
    if (!form.stock.trim() || !Number.isSafeInteger(stock) || stock < 0) nextErrors.stock = 'Nhập tồn kho là số nguyên không âm.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Vui lòng kiểm tra lại thông tin sản phẩm.')
      return
    }

    setIsUploading(true)
    try {
      const images = await uploadImages()
      setUploadMessage(images.length ? 'Đã chuẩn bị ảnh. Đang lưu sản phẩm...' : 'Đang lưu sản phẩm...')
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        stock,
        images,
        status: form.status,
      })
    } catch (uploadError) {
      toast.error(uploadError.message || 'Không thể tải ảnh sản phẩm lên.')
    } finally {
      setIsUploading(false)
      setUploadMessage('')
    }
  }

  const busy = loading || isUploading

  return (
    <form className="admin-product-form" onSubmit={submit} noValidate aria-busy={busy || undefined}>
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
        <Field className="admin-product-form__full" label="Ảnh sản phẩm" error={errors.images} group>
          <div className="admin-product-form__images">
            <label className={`admin-product-form__upload ${busy ? 'admin-product-form__upload--disabled' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={busy || imageFiles.length >= maxProductImages}
                onChange={addImages}
              />
              <ImagePlus size={20} aria-hidden="true" />
              <span>{initialProduct ? 'Thêm hoặc thay ảnh sản phẩm' : 'Chọn ảnh từ thiết bị'}</span>
              <small>JPEG, PNG, WebP hoặc AVIF · tối đa 5 MB/ảnh</small>
            </label>
            <p className="admin-product-form__image-help">Tối đa {maxProductImages} ảnh. Ảnh đầu tiên sẽ được dùng làm ảnh đại diện.</p>
            {imageFiles.length > 0 && (
              <div className="admin-product-form__previews" aria-label="Xem trước ảnh sản phẩm">
                {imageFiles.map((image, index) => (
                  <figure key={image.id}>
                    <ProductMedia src={image.previewUrl} alt={`Xem trước sản phẩm ${index + 1}`} />
                    <figcaption>{index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}{image.publicUrl ? ' · Đã tải' : ''}</figcaption>
                    <button
                      className="admin-product-form__remove-image"
                      type="button"
                      disabled={busy}
                      onClick={() => removeImage(image.id)}
                      aria-label={`Xóa ảnh sản phẩm ${index + 1}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
            {uploadMessage && <p className="admin-product-form__upload-status" role="status">{uploadMessage}</p>}
          </div>
        </Field>
      </div>
      <div className="admin-product-form__actions">
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Đóng</Button>
        <Button type="submit" loading={busy} icon={initialProduct ? <Pencil size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}>{initialProduct ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}</Button>
      </div>
    </form>
  )
}

function Field({ label, error, className = '', children, group = false }) {
  const Component = group ? 'div' : 'label'
  return <Component className={`admin-product-form__field ${className}`}><span>{label}</span>{children}{error && <small className="admin-product-form__error">{error}</small>}</Component>
}

function AdminListProduct() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingProductId, setUpdatingProductId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await listAdminProducts({ search, status })
      setProducts(response.data || [])
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải sản phẩm.')
    } finally {
      setIsLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadProducts() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadProducts])

  const saveProduct = async (product) => {
    setIsSaving(true)
    try {
      const response = editingProduct
        ? await updateAdminProduct(editingProduct.id || editingProduct._id, product, editingProduct.updatedAt)
        : await createAdminProduct(product)
      toast.success(response.message || (editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.'))
      setIsFormOpen(false)
      setEditingProduct(null)
      await loadProducts()
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tạo sản phẩm.')
    } finally {
      setIsSaving(false)
    }
  }

  const openProductEdit = (product) => {
    setSelectedProduct(null)
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const toggleProductVisibility = async (product) => {
    if (updatingProductId) return
    const nextStatus = product.status === 'active' ? 'inactive' : 'active'
    setUpdatingProductId(product.id || product._id)
    try {
      const response = await updateAdminProduct(product.id || product._id, { status: nextStatus }, product.updatedAt)
      toast.success(response.message || (nextStatus === 'active' ? 'Đã hiện sản phẩm.' : 'Đã ẩn sản phẩm.'))
      await loadProducts()
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể cập nhật trạng thái sản phẩm.')
      if (requestError.statusCode === 409) await loadProducts()
    } finally {
      setUpdatingProductId(null)
    }
  }

  const showProductDetail = async (product) => {
    const productId = product.id || product._id
    setSelectedProduct(product)
    setDetailError('')
    setIsDetailLoading(true)
    try {
      const response = await getAdminProduct(productId)
      setSelectedProduct(response.data?.product || product)
    } catch (requestError) {
      setDetailError(requestError.message || 'Không thể tải chi tiết sản phẩm.')
    } finally {
      setIsDetailLoading(false)
    }
  }

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
        <small>{products.length} sản phẩm</small>
      </div>

      <section className="admin-product-page__stats" aria-label="Tổng quan sản phẩm">
        <Card className="admin-product-page__stat"><Boxes size={20} aria-hidden="true" /><span><small>Tổng sản phẩm</small><strong>{products.length}</strong></span></Card>
        <Card className="admin-product-page__stat admin-product-page__stat--gold"><CircleDollarSign size={20} aria-hidden="true" /><span><small>Đang kinh doanh</small><strong>{products.filter((product) => product.status === 'active').length}</strong></span></Card>
        <Card className="admin-product-page__stat admin-product-page__stat--turquoise"><PackageX size={20} aria-hidden="true" /><span><small>Sản phẩm hết hàng</small><strong>{products.filter((product) => product.status === 'sold_out' || product.stock <= 0).length}</strong></span></Card>
      </section>

      <Card className="admin-product-page__card">
        <div className="admin-product-page__toolbar">
          <div className="admin-product-page__summary"><strong>{products.length}</strong><span>sản phẩm</span></div>
          <div className="admin-product-page__filters">
            <label className="admin-product-page__search"><Search size={17} aria-hidden="true" /><Input placeholder="Tìm tên sản phẩm" aria-label="Tìm tên sản phẩm" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <label className="admin-product-page__select"><span>Trạng thái</span><select aria-label="Lọc trạng thái sản phẩm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </div>
        {isLoading ? <div className="admin-product-page__state" role="status"><strong>Đang tải sản phẩm</strong></div> : error ? <div className="admin-product-page__state" role="alert"><AlertCircle size={30} aria-hidden="true" /><strong>Không thể tải sản phẩm</strong><p>{error}</p><Button size="sm" onClick={loadProducts}>Thử lại</Button></div> : products.length === 0 ? <div className="admin-product-page__state" role="status">
          <Archive size={30} aria-hidden="true" />
          <strong>Chưa có dữ liệu sản phẩm</strong>
          <p>Chưa có sản phẩm phù hợp với bộ lọc hiện tại.</p>
          <Button variant="secondary" size="sm" icon={<Plus size={15} aria-hidden="true" />} onClick={() => setIsFormOpen(true)}>Thêm sản phẩm</Button>
        </div> : <div className="admin-product-page__list">{products.map((product) => <article className="admin-product-page__product" key={product.id || product._id}>
          <ProductMedia src={product.images?.[0]} alt={product.name} className="admin-product-page__thumbnail" />
          <div className="admin-product-page__product-info"><strong>{product.name}</strong><p>{new Intl.NumberFormat('vi-VN').format(product.price)}đ · Tồn kho {product.stock} · {statusLabels[product.status]}</p></div>
          <Button
            className="admin-product-page__detail-button"
            variant="secondary"
            size="sm"
            onClick={() => showProductDetail(product)}
          >
            Xem chi tiết
          </Button>
          <Button
            className="admin-product-page__visibility-button"
            variant={product.status === 'active' ? 'accent' : 'primary'}
            size="sm"
            icon={product.status === 'active' ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            loading={updatingProductId === (product.id || product._id)}
            disabled={Boolean(updatingProductId) || product.status === 'sold_out'}
            onClick={() => toggleProductVisibility(product)}
            aria-label={product.status === 'active' ? `Ẩn ${product.name}` : `Hiện ${product.name}`}
          >
            {product.status === 'active' ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
          </Button>
        </article>)}</div>}
      </Card>

      <Modal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? `Chi tiết sản phẩm: ${selectedProduct.name}` : 'Chi tiết sản phẩm'}
        description="Thông tin sản phẩm trong hệ thống quản trị."
        size="lg"
      >
        <ProductDetailContent product={selectedProduct} loading={isDetailLoading} error={detailError} />
        {selectedProduct && !isDetailLoading && !detailError && (
          <div className="admin-product-detail__actions">
            <Button variant="primary" icon={<Pencil size={16} aria-hidden="true" />} onClick={() => openProductEdit(selectedProduct)}>
              Chỉnh sửa sản phẩm
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingProduct(null) }} title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'} description="Nhập thông tin theo model sản phẩm của hệ thống." size="lg">
        <ProductForm key={editingProduct?.id || editingProduct?._id || 'new'} initialProduct={editingProduct} onCancel={() => { setIsFormOpen(false); setEditingProduct(null) }} onSubmit={saveProduct} loading={isSaving} />
      </Modal>
    </div>
  )
}

export default AdminListProduct

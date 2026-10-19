import ErrorPageView from './ErrorPageView.jsx'

export default function ErrorPage404() {
  return <ErrorPageView code="404" eyebrow="Không tìm thấy / 404" title="Trang này đã đi lạc khỏi bản đồ." description="Đường dẫn bạn mở không tồn tại hoặc nội dung đã được chuyển sang một địa chỉ khác." statusLabel="KHÔNG TÌM THẤY" />
}

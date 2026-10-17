import ErrorPageView from './ErrorPageView.jsx'

export default function InternetConnection() {
  return <ErrorPageView code="503" eyebrow="Kết nối / 503" title="Tín hiệu đang bị gián đoạn." description="Không thể kết nối đến dịch vụ lúc này. Hãy kiểm tra mạng và thử lại sau ít phút." statusLabel="TẠM THỜI NGOẠI TUYẾN" variant="offline" />
}

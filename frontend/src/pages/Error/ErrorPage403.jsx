import ErrorPageView from "./ErrorPageView.jsx";

export default function ErrorPage403() {
  return (
    <ErrorPageView
      code="403"
      eyebrow="Quyền truy cập / 403"
      title="Bạn chưa thể đi qua cánh cửa này."
      description="Tài khoản hiện tại không có quyền truy cập nội dung bạn đang tìm. Hãy quay về trang chủ hoặc trở lại trang trước."
      statusLabel="KHÔNG ĐƯỢC PHÉP"
      variant="forbidden"
    />
  );
}

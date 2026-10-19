import { useState } from 'react'
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, Clock3, HelpCircle, Mail, MapPin, MessageCircle, ShieldCheck, Sparkles, Ticket, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import './FAQ.scss'

const groups = [
  {
    title: 'Khám phá di sản',
    icon: <Sparkles size={20} aria-hidden="true" />,
    questions: [
      ['Chạm Sắc Việt là gì?', 'Chạm Sắc Việt là không gian khám phá di sản Việt Nam thông qua câu chuyện, hình ảnh và trải nghiệm tương tác.'],
      ['Tôi có thể bắt đầu khám phá ở đâu?', 'Bạn có thể bắt đầu từ danh sách địa danh lịch sử hoặc mở trải nghiệm AR để nhận diện landmark quanh mình.'],
      ['Trải nghiệm AR có cần cài thêm ứng dụng không?', 'Không. Trải nghiệm AR chạy trực tiếp trên trình duyệt hỗ trợ camera; hãy cấp quyền camera khi được yêu cầu.'],
    ],
  },
  {
    title: 'Trải nghiệm AR',
    icon: <Ticket size={20} aria-hidden="true" />,
    questions: [
      ['Làm thế nào để bắt đầu AR?', 'Mở trang Trải nghiệm AR, cho phép truy cập camera và hướng camera về landmark được hỗ trợ.'],
      ['Vì sao model 3D chưa hiển thị?', 'Hãy kiểm tra ánh sáng, giữ landmark trong khung hình và đảm bảo trình duyệt đang được cấp quyền camera.'],
      ['Camera có lưu hình ảnh của tôi không?', 'Camera được xử lý trên thiết bị cho mục đích nhận diện trải nghiệm. Bạn luôn kiểm soát quyền truy cập camera của mình.'],
    ],
  },
  {
    title: 'Tài khoản & bảo mật',
    icon: <ShieldCheck size={20} aria-hidden="true" />,
    questions: [
      ['Tôi có thể đăng nhập bằng Google không?', 'Có. Bạn có thể đăng nhập bằng Google hoặc bằng email và mật khẩu đã đăng ký.'],
      ['Tôi quên mật khẩu thì phải làm gì?', 'Chọn “Quên mật khẩu?” trên màn hình đăng nhập và làm theo hướng dẫn khôi phục tài khoản.'],
      ['Tôi có thể cập nhật thông tin cá nhân ở đâu?', 'Mở Hồ sơ cá nhân, chọn Chỉnh sửa hồ sơ, cập nhật thông tin và bấm Lưu thay đổi.'],
    ],
  },
  {
    title: 'Câu hỏi cộng đồng',
    icon: <MessageCircle size={20} aria-hidden="true" />,
    questions: [
      ['Tôi có thể tạo bộ câu hỏi riêng không?', 'Có. Bạn có thể tạo và quản lý các bộ câu hỏi cá nhân trong khu vực Câu hỏi của tôi.'],
      ['Làm thế nào để xem các câu hỏi về địa danh?', 'Truy cập mục Câu hỏi để xem danh sách câu hỏi được cộng đồng chia sẻ theo từng địa danh.'],
      ['Tôi cần hỗ trợ thêm thì liên hệ ở đâu?', 'Bạn có thể gửi yêu cầu qua trang Liên hệ hoặc nhắn tin trực tiếp cho Chạm Sắc Việt.'],
    ],
  },
]

const facts = [
  [CalendarDays, 'Khám phá bất cứ lúc nào', 'Nội dung di sản luôn sẵn sàng'],
  [Clock3, 'Trải nghiệm nhanh gọn', 'Bắt đầu chỉ với vài thao tác'],
  [MapPin, 'Theo từng địa danh', 'Tìm hiểu câu chuyện tại nơi bạn đến'],
]

export default function FAQ() {
  const [openItem, setOpenItem] = useState('0-0')

  const toggleItem = (id) => setOpenItem((current) => current === id ? '' : id)

  return (
    <main className="faq-page">
      <div className="faq-page__shell">
        <header className="faq-page__hero">
          <div className="faq-page__hero-copy">
            <p className="faq-page__eyebrow"><HelpCircle size={16} aria-hidden="true" /> HỖ TRỢ KHÁM PHÁ</p>
            <h1>Câu hỏi thường gặp</h1>
            <p className="faq-page__intro">Tìm câu trả lời nhanh cho hành trình khám phá di sản cùng Chạm Sắc Việt.</p>
            <div className="faq-page__hero-actions">
              <Button as={Link} to="/tickets" icon={<ArrowUpRight size={17} aria-hidden="true" />}>Khám phá địa danh</Button>
              <Button as={Link} to="/contact-us" variant="secondary">Liên hệ hỗ trợ</Button>
            </div>
          </div>
          <Card className="faq-page__hero-note">
            <div className="faq-page__hero-note-head"><span className="faq-page__hero-note-icon"><CheckCircle2 size={22} aria-hidden="true" /></span><strong>Chưa tìm thấy câu trả lời?</strong></div>
            <div className="faq-page__hero-note-divider" />
            <p>Đội ngũ Chạm Sắc Việt luôn sẵn sàng hỗ trợ bạn.</p>
          </Card>
        </header>

        <div className="faq-page__layout">
          <Card className="faq-page__rail" eyebrow="TRƯỚC KHI BẠN HỎI" title="Khám phá dễ dàng hơn" description="Một vài thông tin nhanh giúp bạn bắt đầu.">
            <div className="faq-page__facts">
              {facts.map(([Icon, title, text]) => <div key={title}><Icon size={18} aria-hidden="true" /><span><strong>{title}</strong><small>{text}</small></span></div>)}
            </div>
            <div className="faq-page__rail-links">
              <Link to="/data-policy">Chính sách dữ liệu <ArrowUpRight size={14} aria-hidden="true" /></Link>
              <Link to="/contact-us">Gửi câu hỏi <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </div>
          </Card>

          <div className="faq-page__groups">
            {groups.map((group, groupIndex) => <Card className="faq-page__group" key={group.title}>
              <div className="faq-page__group-heading"><span>{group.icon}</span><div><p>GIẢI ĐÁP</p><h2>{group.title}</h2></div></div>
              <div className="faq-page__questions">
                {group.questions.map(([question, answer], questionIndex) => {
                  const id = `${groupIndex}-${questionIndex}`
                  const isOpen = openItem === id
                  return <div className={`faq-page__item${isOpen ? ' is-open' : ''}`} key={question}>
                    <button type="button" className="faq-page__question" aria-expanded={isOpen} aria-controls={`answer-${id}`} onClick={() => toggleItem(id)}>
                      <span><UserRound size={16} aria-hidden="true" />{question}</span><ChevronDown size={18} aria-hidden="true" />
                    </button>
                    <div id={`answer-${id}`} className="faq-page__answer" hidden={!isOpen}><p>{answer}</p></div>
                  </div>
                })}
              </div>
            </Card>)}
          </div>
        </div>

        <Card
          className="faq-page__contact"
          actions={<Button as={Link} to="/contact-us" variant="secondary" icon={<ArrowUpRight size={16} aria-hidden="true" />}>Liên hệ ngay</Button>}
        >
          <div className="faq-page__contact-content"><span className="faq-page__contact-icon"><Mail size={19} aria-hidden="true" /></span><div><strong>Vẫn còn thắc mắc?</strong><p>Gửi câu hỏi cho chúng tôi, đội ngũ sẽ phản hồi sớm nhất.</p></div></div>
        </Card>
      </div>
    </main>
  )
}

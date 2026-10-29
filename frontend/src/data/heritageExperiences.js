import cuChiTarget from '../assets/ar-targets/card-18.png'
import dragonBridgeTarget from '../assets/ar-targets/card-21.png'
import hoaLuTarget from '../assets/ar-targets/card-22.png'
import independencePalaceTarget from '../assets/ar-targets/card-23.png'
import templeOfLiteratureTarget from '../assets/ar-targets/card-24.png'
import swordLakeTarget from '../assets/ar-targets/card-25.png'
import hueTarget from '../assets/ar-targets/card-27.png'
import fansipanTarget from '../assets/ar-targets/fansipan-card.png'
import muiCaMauTarget from '../assets/ar-targets/mui-ca-mau-card.png'

const AR_ASSET_ORIGIN = 'https://assets.chamsacviet.io.vn'

export const THAP_RUA_MODEL_URL = '/ar-assets/models/thap-rua/Meshy_AI_turtle_tower_ar_optim_1015064523_texture.glb'
export const QUOC_TU_GIAM_MODEL_URL = '/ar-assets/models/quoc-tu-giam/ban%20mau%20quoc%20tu%20giam%20final.glb'
export const CAU_RONG_MODEL_URL = '/ar-assets/models/cau-rong/Cau%20rong%20Da%20Nang%20Minh%20Dang%20an%20Cut.glb'
export const CU_CHI_MODEL_URL = '/ar-assets/models/cu-chi/cu%20chi.glb'
export const HOA_LU_MODEL_URL = '/ar-assets/models/hoa-lu/Hoa%20Lu%20da%20nen.glb'
export const DINH_DOC_LAP_MODEL_URL = '/ar-assets/models/dinh-doc-lap/Dinh%20doc%20lap%20final.glb'
export const NGO_MON_HUE_MODEL_URL = '/ar-assets/models/ngo-mon-hue/Ngo%20Mon%20Hue%20final%20nhe.glb'
export const FANSIPAN_MODEL_URL = '/ar-assets/models/fansipan/test%20fansipan.glb'
export const MUI_CA_MAU_MODEL_URL = '/ar-assets/models/mui-ca-mau/Mui%20Ca%20Mau%20nhe.glb'

const toSameOriginAssetUrl = (url) => {
  if (typeof url !== 'string' || !url.startsWith(`${AR_ASSET_ORIGIN}/`)) return url
  return `/ar-assets/${url.slice(AR_ASSET_ORIGIN.length + 1)}`
}

export const HERITAGE_EXPERIENCES = [
  {
    id: 'dia-dao-cu-chi',
    targetIndex: 0,
    name: 'Địa đạo Củ Chi',
    location: 'Thành phố Hồ Chí Minh',
    tagline: 'Kỳ tích dưới lòng đất',
    targetImage: cuChiTarget,
    audioUrl: '/audio/heritage/dia-dao-cu-chi.mp3',
    model: {
      url: CU_CHI_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Công trình quân sự đặc biệt, biểu tượng cho tinh thần kiên cường của quân dân vùng đất thép.',
    content: [
      'Địa đạo Củ Chi nằm tại khu vực Củ Chi, Thành phố Hồ Chí Minh, gắn liền với cuộc kháng chiến chống thực dân Pháp và đế quốc Mỹ. Hệ thống đường hầm được xây dựng, mở rộng qua nhiều giai đoạn để trú ẩn, sinh hoạt, liên lạc và tổ chức chiến đấu.',
      'Ngày nay, di tích là địa chỉ giáo dục lịch sử, giúp các thế hệ tìm hiểu về chiến tranh, sự hy sinh và giá trị của hòa bình.',
    ],
  },
  {
    id: 'cau-rong-da-nang',
    targetIndex: 1,
    name: 'Cầu Rồng Đà Nẵng',
    location: 'Đà Nẵng',
    tagline: 'Rồng vàng vươn ra biển lớn',
    targetImage: dragonBridgeTarget,
    audioUrl: '/audio/heritage/cau-rong-da-nang.mp3',
    model: {
      url: CAU_RONG_MODEL_URL,
      scale: 2,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Biểu tượng kiến trúc hiện đại bắc qua sông Hàn với màn trình diễn phun lửa, phun nước đặc trưng.',
    content: [
      'Cầu Rồng mô phỏng hình dáng một con rồng đang uốn lượn và hướng ra biển. Cầu được khởi công năm 2009, khánh thành ngày 29/3/2013, dài khoảng 666 m và có 6 làn xe cơ giới.',
      'Thiết kế kết hợp kỹ thuật xây dựng hiện đại với hình tượng rồng trong văn hóa Việt Nam, đồng thời kết nối giao thông hai bờ sông Hàn.',
    ],
  },
  {
    id: 'co-do-hoa-lu',
    targetIndex: 2,
    name: 'Cố đô Hoa Lư',
    location: 'Ninh Bình',
    tagline: 'Nơi khởi đầu một triều đại độc lập',
    targetImage: hoaLuTarget,
    audioUrl: '/audio/heritage/co-do-hoa-lu.mp3',
    model: {
      url: HOA_LU_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Kinh đô đầu tiên của nhà nước phong kiến trung ương tập quyền Việt Nam, giữa địa thế núi đá vôi hùng vĩ.',
    content: [
      'Cố đô Hoa Lư từng là kinh đô của nước Đại Cồ Việt từ năm 968 đến năm 1010, gắn với các triều đại Đinh, Tiền Lê và buổi đầu triều Lý. Năm 968, Đinh Bộ Lĩnh thống nhất đất nước, lên ngôi Hoàng đế và chọn Hoa Lư làm kinh đô.',
      'Nơi đây còn lưu giữ nhiều dấu tích như đền vua Đinh Tiên Hoàng, đền vua Lê Đại Hành và chùa Nhất Trụ.',
    ],
  },
  {
    id: 'dinh-doc-lap',
    targetIndex: 3,
    name: 'Dinh Độc Lập',
    location: 'Thành phố Hồ Chí Minh',
    tagline: 'Dấu ấn lịch sử thống nhất đất nước',
    targetImage: independencePalaceTarget,
    audioUrl: '/audio/heritage/dinh-doc-lap.mp3',
    model: {
      url: DINH_DOC_LAP_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Di tích quốc gia đặc biệt gắn với dấu mốc giải phóng miền Nam, thống nhất đất nước ngày 30/4/1975.',
    content: [
      'Công trình hiện nay do kiến trúc sư Ngô Viết Thụ thiết kế, được khởi công năm 1962 và khánh thành năm 1966.',
      'Ngày 30/4/1975, sự kiện xe tăng tiến vào Dinh Độc Lập trở thành dấu mốc lịch sử quan trọng. Công trình được xếp hạng Di tích quốc gia đặc biệt năm 2009.',
    ],
  },
  {
    id: 'van-mieu-quoc-tu-giam',
    targetIndex: 4,
    name: 'Văn Miếu – Quốc Tử Giám',
    location: 'Hà Nội',
    tagline: 'Nơi lưu giữ truyền thống hiếu học',
    targetImage: templeOfLiteratureTarget,
    audioUrl: '/audio/heritage/van-mieu-quoc-tu-giam.mp3',
    model: {
      url: QUOC_TU_GIAM_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Di tích lịch sử tiêu biểu cho truyền thống giáo dục, khoa bảng và tinh thần tôn sư trọng đạo của người Việt.',
    content: [
      'Văn Miếu được xây dựng năm 1070 dưới triều vua Lý Thánh Tông. Quốc Tử Giám được thành lập năm 1076 dưới triều vua Lý Nhân Tông, trở thành trung tâm đào tạo nhân tài quan trọng của Đại Việt.',
      'Nơi đây nổi bật với Khuê Văn Các, Giếng Thiên Quang và 82 bia Tiến sĩ đặt trên lưng rùa đá.',
    ],
  },
  {
    id: 'ho-guom',
    targetIndex: 5,
    name: 'Hồ Gươm',
    location: 'Hà Nội',
    tagline: 'Biểu tượng ngàn năm của Thủ đô',
    targetImage: swordLakeTarget,
    audioUrl: '/audio/heritage/ho-guom.mp3',
    model: {
      url: THAP_RUA_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0.02 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Không gian lịch sử và văn hóa giữa trung tâm Hà Nội, gắn với truyền thuyết vua Lê Thái Tổ trả gươm thần.',
    content: [
      'Hồ Gươm, hay Hồ Hoàn Kiếm, gắn với truyền thuyết vua Lê Thái Tổ trả lại thanh gươm thần cho Rùa Vàng sau khi đánh thắng quân Minh.',
      'Tháp Rùa, cầu Thê Húc, Đền Ngọc Sơn, Tháp Bút và Đài Nghiên tạo nên quần thể cảnh quan kết nối quá khứ với nhịp sống hiện đại của Thủ đô.',
    ],
  },
  {
    id: 'co-do-hue',
    targetIndex: 6,
    name: 'Cố đô Huế',
    location: 'Huế',
    tagline: 'Dấu ấn vàng son của triều Nguyễn',
    targetImage: hueTarget,
    audioUrl: '/audio/heritage/co-do-hue.mp3',
    model: {
      url: NGO_MON_HUE_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Kinh đô triều Nguyễn bên dòng sông Hương, nơi lưu giữ quần thể kiến trúc cung đình được UNESCO ghi danh.',
    content: [
      'Cố đô Huế là kinh đô của Việt Nam dưới triều Nguyễn từ năm 1802 đến năm 1945, với những công trình nổi bật như Ngọ Môn, Điện Thái Hòa, Tử Cấm Thành và các lăng tẩm vua Nguyễn.',
      'Năm 1993, Quần thể di tích Cố đô Huế được UNESCO ghi danh là Di sản Thế giới.',
    ],
  },
  {
    id: 'fansipan',
    targetIndex: 7,
    name: 'Đỉnh Fansipan',
    location: 'Sa Pa, Lào Cai',
    tagline: 'Nóc nhà Đông Dương giữa đại ngàn Hoàng Liên Sơn',
    targetImage: fansipanTarget,
    audioUrl: '/audio/heritage/fansipan.mp3',
    model: {
      url: FANSIPAN_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Đỉnh núi cao nhất Việt Nam, nằm trong dãy Hoàng Liên Sơn và được mệnh danh là Nóc nhà Đông Dương.',
    content: [
      'Fansipan thuộc dãy Hoàng Liên Sơn, gần thị xã Sa Pa, tỉnh Lào Cai. Địa danh nổi bật với cảnh quan núi cao, khí hậu phân tầng và hệ sinh thái đa dạng.',
      'Với độ cao 3.147,3 m, Fansipan là điểm đến tiêu biểu của vùng Tây Bắc và hành trình khám phá thiên nhiên Việt Nam.',
    ],
  },
  {
    id: 'mui-ca-mau',
    targetIndex: 8,
    name: 'Mũi Cà Mau',
    location: 'Ngọc Hiển, Cà Mau',
    tagline: 'Cực Nam đất liền, nơi rừng gặp biển',
    targetImage: muiCaMauTarget,
    audioUrl: '/audio/heritage/mui-ca-mau.mp3',
    model: {
      url: MUI_CA_MAU_MODEL_URL,
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      thumbnail: null,
    },
    shortDescription: 'Vùng cực Nam đất liền Việt Nam với cảnh quan ven biển và hệ sinh thái rừng ngập mặn đặc trưng.',
    content: [
      'Mũi Cà Mau thuộc huyện Ngọc Hiển, tỉnh Cà Mau. Khu vực nổi bật với quá trình bồi tụ phù sa, rừng ngập mặn và các biểu tượng đánh dấu vùng Đất Mũi.',
      'Đây là nơi có thể ngắm mặt trời trên biển ở cả phía Đông và phía Tây, đồng thời là một phần của Khu dự trữ sinh quyển thế giới Mũi Cà Mau.',
    ],
  },
]

export function getHeritageExperienceByTargetIndex(targetIndex) {
  return HERITAGE_EXPERIENCES.find((experience) => experience.targetIndex === targetIndex) || null
}

const normalizeContent = (content, fallback) => {
  if (Array.isArray(content)) return content.filter((paragraph) => typeof paragraph === 'string' && paragraph.trim())
  if (typeof content !== 'string' || !content.trim()) return fallback
  return content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
}

export function mergeHeritageExperiences(remoteExperiences = []) {
  const remoteByTargetIndex = new Map(
    remoteExperiences
      .filter((experience) => Number.isInteger(experience?.targetIndex))
      .map((experience) => [experience.targetIndex, experience]),
  )

  return HERITAGE_EXPERIENCES.map((fallback) => {
    const remote = remoteByTargetIndex.get(fallback.targetIndex)
    if (!remote) return fallback

    return {
      ...fallback,
      backendId: remote.id || fallback.backendId,
      modelId: remote.modelId || fallback.modelId,
      name: remote.name || fallback.name,
      shortDescription: remote.shortDescription || fallback.shortDescription,
      content: normalizeContent(remote.content, fallback.content),
      targetImageUrl: remote.targetImageUrl || fallback.targetImageUrl,
      model: remote.model?.url
        ? { ...remote.model, url: toSameOriginAssetUrl(remote.model.url) }
        : fallback.model,
    }
  })
}

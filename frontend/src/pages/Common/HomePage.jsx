import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Building2,
  Castle,
  GraduationCap,
  Landmark,
  MapPin,
  Mountain,
  QrCode,
  Sparkles,
  Trees,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import colorfulStarArtifact from "../../assets/elements/IMG_4814.PNG";
import diceArtifact from "../../assets/elements/IMG_4818.PNG";
import flowerImage from "../../assets/flower.png";
import quocTuGiamModel from "../../assets/ar_files/QuocTuGiam.glb";
import fansipanImage from "../../assets/landmarks/fansipan.jpg";
import hoGuomImage from "../../assets/landmarks/ho-guom.jpg";
import vanMieuImage from "../../assets/landmarks/van-mieu.jpg";
import hoaLuImage from "../../assets/landmarks/hoa-lu.jpg";
import hueImage from "../../assets/landmarks/hue.jpg";
import cauRongImage from "../../assets/landmarks/cau-rong.jpg";
import dinhDocLapImage from "../../assets/landmarks/dinh-doc-lap.jpg";
import cuChiImage from "../../assets/landmarks/cu-chi.jpg";
import muiCaMauImage from "../../assets/landmarks/mui-ca-mau.jpg";
const landmarkImageFiles = import.meta.glob("../../assets/landmarks/new/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});
import FloatingCharacter from "../../components/layout/FloatingCharacter.jsx";
import "./HomePage.scss";

const landmarks = [
  {
    name: "Fansipan",
    location: "Sa Pa · Lào Cai",
    region: "Tây Bắc",
    fact: "Nóc nhà Đông Dương, cao 3.147,3 m giữa dãy Hoàng Liên Sơn.",
    tone: "gold",
    icon: Mountain,
    image: fansipanImage,
    albumKey: "fansipan",
  },
  {
    name: "Hồ Gươm",
    location: "Hà Nội",
    region: "Đồng bằng Bắc Bộ",
    fact: "Hồ Hoàn Kiếm gắn với truyền thuyết vua Lê Thái Tổ trả gươm báu.",
    tone: "pink",
    icon: Landmark,
    image: hoGuomImage,
    albumKey: "ho-guom",
  },
  {
    name: "Văn Miếu – Quốc Tử Giám",
    location: "Hà Nội",
    region: "Đồng bằng Bắc Bộ",
    fact: "Di tích lưu giữ dấu ấn giáo dục và truyền thống hiếu học của Việt Nam.",
    tone: "turquoise",
    icon: GraduationCap,
    image: vanMieuImage,
    albumKey: "van-mieu",
  },
  {
    name: "Cố đô Hoa Lư",
    location: "Ninh Bình",
    region: "Đồng bằng Bắc Bộ",
    fact: "Kinh đô của Đại Cồ Việt từ năm 968 đến năm 1010.",
    tone: "pink",
    icon: Castle,
    image: hoaLuImage,
    albumKey: "co-do-hoa-lu",
  },
  {
    name: "Cố đô Huế",
    location: "Bên dòng sông Hương",
    region: "Miền Trung",
    fact: "Kinh đô triều Nguyễn bên sông Hương, lưu dấu quần thể kiến trúc cung đình.",
    tone: "gold",
    icon: Castle,
    image: hueImage,
    albumKey: "co-do-hue",
  },
  {
    name: "Cầu Rồng",
    location: "Đà Nẵng",
    region: "Miền Trung",
    fact: "Cây cầu hình rồng bắc qua sông Hàn, nổi bật với màn phun lửa và nước.",
    tone: "turquoise",
    icon: Waves,
    image: cauRongImage,
    albumKey: "cau-rong",
  },
  {
    name: "Dinh Độc Lập",
    location: "TP. Hồ Chí Minh",
    region: "Nam Bộ",
    fact: "Công trình gắn với dấu mốc lịch sử ngày 30 tháng 4 năm 1975.",
    tone: "gold",
    icon: Building2,
    image: dinhDocLapImage,
    albumKey: "dinh-doc-lap",
  },
  {
    name: "Địa đạo Củ Chi",
    location: "TP. Hồ Chí Minh",
    region: "Nam Bộ",
    fact: "Hệ thống đường hầm thể hiện sự sáng tạo và tinh thần kiên cường.",
    tone: "pink",
    icon: Compass,
    image: cuChiImage,
    albumKey: "dia-dao-cu-chi",
  },
  {
    name: "Mũi Cà Mau",
    location: "Cà Mau",
    region: "Nam Bộ",
    fact: "Vùng cực Nam đất liền với cảnh quan ven biển và hệ sinh thái rừng ngập mặn.",
    tone: "turquoise",
    icon: Trees,
    image: muiCaMauImage,
    albumKey: "mui-ca-mau",
  },
];

const steps = [
  {
    number: "01",
    title: "Chọn câu chuyện",
    description: "Bắt đầu với một địa danh trong hành trình Chạm Sắc Việt.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Quét mã trên sản phẩm",
    description: "Dùng điện thoại quét QR tương ứng trên bộ sản phẩm.",
    icon: QrCode,
  },
  {
    number: "03",
    title: "Mở trải nghiệm AR",
    description: "Khám phá câu chuyện di sản qua nội dung tương tác trên web.",
    icon: Sparkles,
  },
];

const MODEL_ZOOM_MIN = 0.4;
const MODEL_ZOOM_MAX = 2.5;
const SMALL_SCREEN_QUERY = "(max-width: 640px)";

function isSmallScreen() {
  return window.matchMedia(SMALL_SCREEN_QUERY).matches;
}

function syncGroundShadow(interaction, scale) {
  if (!interaction.model || !interaction.groundShadow) return;

  interaction.groundShadow.position.set(
    interaction.model.position.x,
    interaction.model.position.y + interaction.localBottom * scale - 0.012,
    interaction.model.position.z,
  );
}

function applyModelZoom(interaction, nextZoom) {
  interaction.zoom = THREE.MathUtils.clamp(
    nextZoom,
    MODEL_ZOOM_MIN,
    MODEL_ZOOM_MAX,
  );
  if (!interaction.model) return;

  const scale = interaction.baseScale * interaction.zoom;
  interaction.model.scale.setScalar(scale);
  syncGroundShadow(interaction, scale);
}

function HeroModel() {
  const mountRef = useRef(null);
  const interactionRef = useRef({
    model: null,
    groundShadow: null,
    baseScale: 1,
    localBottom: 0,
    zoom: 1,
    active: false,
    lastX: 0,
    lastPinchDistance: null,
    pointers: new Map(),
  });

  const setZoom = (nextZoom) => {
    applyModelZoom(interactionRef.current, nextZoom);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const interaction = interactionRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.25, 4.8);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const handleWheel = (event) => {
      if (isSmallScreen()) return;

      event.preventDefault();
      const interaction = interactionRef.current;
      applyModelZoom(interaction, interaction.zoom - event.deltaY * 0.001);
    };
    mount.addEventListener("wheel", handleWheel, { passive: false });
    scene.add(new THREE.HemisphereLight(0xfff7eb, 0x211832, 3.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0008;
    keyLight.shadow.normalBias = 0.015;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xeea53b, 1.8);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    let model;
    let groundShadow;
    let frameId = null;
    let visibilityObserver;
    let isVisible = !("IntersectionObserver" in window);
    let disposed = false;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(quocTuGiamModel, (gltf) => {
      if (disposed) return;
      const sourceModel = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(sourceModel);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model = new THREE.Group();
      sourceModel.position.set(-center.x, -center.y, -center.z);
      model.add(sourceModel);
      const baseScale = 2 / (Math.max(size.x, size.y, size.z) || 1);
      const localBottom = bounds.min.y - center.y;
      const initialScale = baseScale * interactionRef.current.zoom;
      interactionRef.current.baseScale = baseScale;
      interactionRef.current.localBottom = localBottom;
      model.scale.setScalar(initialScale);
      model.position.set(0, 0.35, 0);
      model.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          material.roughness = Math.max(material.roughness ?? 0.7, 0.72);
          material.metalness = Math.min(material.metalness ?? 0, 0.12);
          material.needsUpdate = true;
        });
      });
      interactionRef.current.model = model;
      scene.add(model);
      const maximumScale = baseScale * MODEL_ZOOM_MAX;
      groundShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(
          Math.max(size.x * maximumScale * 1.3, 2.4),
          Math.max(size.z * maximumScale * 1.7, 1.6),
        ),
        new THREE.ShadowMaterial({
          color: 0x211832,
          opacity: 0.3,
          transparent: true,
          depthWrite: false,
        }),
      );
      groundShadow.rotation.x = -Math.PI / 2;
      groundShadow.receiveShadow = true;
      interactionRef.current.groundShadow = groundShadow;
      syncGroundShadow(interactionRef.current, initialScale);
      scene.add(groundShadow);
    }, undefined, (error) => {
      console.error("Không thể tải model Văn Miếu – Quốc Tử Giám", error);
    });
    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const animate = () => {
      frameId = null;
      if (disposed || !isVisible) return;
      if (model && !interactionRef.current.active) model.rotation.y += 0.004;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    const startRendering = () => {
      if (!disposed && isVisible && frameId === null) {
        frameId = window.requestAnimationFrame(animate);
      }
    };
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        if (isVisible) {
          resize();
          startRendering();
        } else if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
      }, { threshold: 0.01 });
      visibilityObserver.observe(mount);
    } else {
      startRendering();
    }
    return () => {
      disposed = true;
      interaction.model = null;
      interaction.groundShadow = null;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      observer.disconnect();
      visibilityObserver?.disconnect();
      mount.removeEventListener("wheel", handleWheel);
      model?.traverse((child) => {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
        else child.material?.dispose();
      });
      groundShadow?.geometry.dispose();
      groundShadow?.material.dispose();
      renderer.dispose();
      dracoLoader.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const handlePointerDown = (event) => {
    const interaction = interactionRef.current;
    interaction.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    interaction.active = true;
    interaction.lastX = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePointerMove = (event) => {
    const interaction = interactionRef.current;
    if (!interaction.pointers.has(event.pointerId)) return;
    interaction.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (interaction.pointers.size >= 2) {
      if (isSmallScreen()) {
        interaction.lastPinchDistance = null;
        return;
      }

      const [first, second] = [...interaction.pointers.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (interaction.lastPinchDistance) {
        setZoom(interaction.zoom * (distance / interaction.lastPinchDistance));
      }
      interaction.lastPinchDistance = distance;
      return;
    }

    if (!interaction.model) return;
    interaction.model.rotation.y += (event.clientX - interaction.lastX) * 0.012;
    interaction.lastX = event.clientX;
  };
  const handlePointerUp = (event) => {
    const interaction = interactionRef.current;
    interaction.pointers.delete(event.pointerId);
    interaction.active = interaction.pointers.size > 0;
    interaction.lastPinchDistance = null;
    const [remainingPointer] = interaction.pointers.values();
    if (remainingPointer) interaction.lastX = remainingPointer.x;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  return (
    <div
      ref={mountRef}
      className="home-hero__model"
      role="group"
      aria-label="Mô hình 3D Văn Miếu – Quốc Tử Giám. Kéo để xoay, sử dụng các nút điều khiển để thu phóng."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="home-hero__model-controls"
        role="group"
        aria-label="Thu phóng mô hình"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Phóng to mô hình"
          title="Phóng to"
          onClick={() => setZoom(interactionRef.current.zoom + 0.18)}
        >
          <ZoomIn size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Thu nhỏ mô hình"
          title="Thu nhỏ"
          onClick={() => setZoom(interactionRef.current.zoom - 0.18)}
        >
          <ZoomOut size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function HomePage() {
  const [albumLandmark, setAlbumLandmark] = useState(null);
  const [albumIndex, setAlbumIndex] = useState(0);

  const openAlbum = (landmark) => {
    setAlbumLandmark(landmark);
    setAlbumIndex(0);
  };

  const closeAlbum = () => setAlbumLandmark(null);

  const activeAlbumImages = albumLandmark
    ? Object.entries(landmarkImageFiles)
        .filter(([path]) => path.includes(`/landmarks/new/${albumLandmark.albumKey}/`))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, image]) => image)
    : [];

  useEffect(() => {
    if (!albumLandmark) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeAlbum();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [albumLandmark]);

  useEffect(() => {
    if (!albumLandmark || activeAlbumImages.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setAlbumIndex((current) => (current + 1) % activeAlbumImages.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [albumLandmark, activeAlbumImages.length]);

  const changeAlbumImage = (direction) => {
    setAlbumIndex((current) =>
      (current + direction + activeAlbumImages.length) % activeAlbumImages.length,
    );
  };

  const scrollToJourney = (event) => {
    const journey = document.getElementById("hanh-trinh");
    if (!journey) return;

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    journey.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-eyebrow">
              <Sparkles size={17} aria-hidden="true" /> Hành trình văn hoá Việt
              Nam
            </p>
            <h1 id="home-hero-title">
              Đi qua mọi miền,
              <br />
              <span className="home-hero__title-accent">
                nối liền yêu thương
              </span>
            </h1>
            <p className="home-hero__lead">
              Qua boardgame và trải nghiệm AR, khám phá chín địa danh cùng những
              lát cắt lịch sử, kiến trúc và thiên nhiên Việt Nam.
            </p>
            <div className="home-hero__actions">
              <Button
                as="a"
                href="#hanh-trinh"
                onClick={scrollToJourney}
                size="lg"
                icon={<ArrowDown size={18} aria-hidden="true" />}
                iconPosition="right"
              >
                Khám phá hành trình
              </Button>
              <Button
                as={Link}
                to="/products"
                variant="secondary"
                size="lg"
                icon={<ArrowRight size={18} aria-hidden="true" />}
                iconPosition="right"
              >
                Ghé cửa hàng
              </Button>
            </div>
            <div className="home-hero__note">
              <span className="home-hero__note-dot" aria-hidden="true" />
              Từ miền núi phía Bắc đến cực Nam Tổ quốc
            </div>
          </div>

          <div
            className="home-hero__art"
            aria-label="Nhận diện thương hiệu Chạm Sắc Việt"
          >
            <div className="home-hero__scene">
              <span
                className="home-hero__orbit home-hero__orbit--one"
                aria-hidden="true"
              />
              <span
                className="home-hero__orbit home-hero__orbit--two"
                aria-hidden="true"
              />
              <img
                className="home-hero__star-color"
                src={colorfulStarArtifact}
                alt=""
              />
              <HeroModel />
            </div>
          </div>
        </div>
        <a
          className="home-hero__scroll"
          href="#hanh-trinh"
          onClick={scrollToJourney}
          aria-label="Cuộn đến hành trình địa danh"
        >
          <span>Cuộn để khám phá</span>
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </section>

      <section
        className="home-journey"
        id="hanh-trinh"
        aria-labelledby="home-journey-title"
      >
        <FloatingCharacter variant={1} className="home-journey__character" />
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">
              <MapPin size={17} aria-hidden="true" /> Bản đồ câu chuyện
            </p>
            <h2 id="home-journey-title">
              Một Việt Nam,
              <br />
              <span>chín miền ký ức.</span>
            </h2>
          </div>
          <p className="home-section-heading__intro">
            Từ đỉnh núi phía Bắc đến vùng rừng ngập mặn phương Nam, mỗi điểm
            dừng hé lộ một dấu ấn riêng của đất nước.
          </p>
        </div>

        <div className="home-landmark-grid">
          {landmarks.map((landmark, index) => {
            const LandmarkIcon = landmark.icon;

            return (
              <Card
                key={landmark.name}
                className={`home-landmark home-landmark--${landmark.tone}`}
                eyebrow={`${String(index + 1).padStart(2, "0")} / ${landmark.region}`}
                title={landmark.name}
                description={landmark.location}
                onClick={() => openAlbum(landmark)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openAlbum(landmark);
                  }
                }}
              >
                <img
                  className="home-landmark__background"
                  src={landmark.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  aria-hidden="true"
                />
                <LandmarkIcon className="home-landmark__icon" size={20} aria-hidden="true" />
                <p>{landmark.fact}</p>
              </Card>
            );
          })}
        </div>
        {albumLandmark && (
          <div className="home-album-modal" role="dialog" aria-modal="true" aria-label={`Album ảnh ${albumLandmark.name}`} onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAlbum();
          }}>
            <div className="home-album-modal__panel">
              <button className="home-album-modal__close" type="button" onClick={closeAlbum} aria-label="Đóng album">×</button>
              <p className="home-eyebrow">Album ảnh · {albumLandmark.location}</p>
              <div className="home-album-modal__heading">
                <h2>{albumLandmark.name}</h2>
                <p>{albumLandmark.fact}</p>
              </div>
              <div className="home-album-modal__main">
                <img key={activeAlbumImages[albumIndex] || albumLandmark.image} src={activeAlbumImages[albumIndex] || albumLandmark.image} alt={`${albumLandmark.name} - ảnh ${albumIndex + 1}`} />
                <button className="home-album-modal__nav home-album-modal__nav--prev" type="button" onClick={() => changeAlbumImage(-1)} aria-label="Ảnh trước"><ChevronLeft size={30} strokeWidth={2.5} aria-hidden="true" /></button>
                <button className="home-album-modal__nav home-album-modal__nav--next" type="button" onClick={() => changeAlbumImage(1)} aria-label="Ảnh tiếp theo"><ChevronRight size={30} strokeWidth={2.5} aria-hidden="true" /></button>
              </div>
              <div className="home-album-modal__thumbs" aria-label="Chọn ảnh trong album">
                {activeAlbumImages.map((image, index) => (
                  <button className={index === albumIndex ? "is-active" : ""} type="button" key={`${albumLandmark.name}-${index}`} onClick={() => setAlbumIndex(index)} aria-label={`Xem ảnh ${index + 1}`}>
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="home-journey__footer">
          <span>Đi một vòng Việt Nam, nghe chín câu chuyện.</span>
          <Button
            as={Link}
            to="/products"
            variant="secondary"
            icon={<ArrowRight size={17} aria-hidden="true" />}
            iconPosition="right"
          >
            Khám phá ngay
          </Button>
        </div>
      </section>

      <section className="home-ar" aria-labelledby="home-ar-title">
        <FloatingCharacter variant={2} className="home-ar__character" />
        <div className="home-ar__visual" aria-hidden="true">
          <div className="home-ar__ring home-ar__ring--outer" />
          <div className="home-ar__ring home-ar__ring--inner" />
          <div className="home-ar__qr">
            <QrCode size={82} strokeWidth={1.2} />
          </div>
          <img className="home-ar__dice" src={diceArtifact} alt="" />
          <span className="home-ar__spark home-ar__spark--one">✳</span>
          <span className="home-ar__spark home-ar__spark--two">✦</span>
          <span className="home-ar__label">Chạm · Quét · Khám phá</span>
        </div>
        <div className="home-ar__content">
          <p className="home-eyebrow">
            <Sparkles size={17} aria-hidden="true" /> Công nghệ gặp di sản
          </p>
          <h2 id="home-ar-title">
            Câu chuyện xưa,
            <br />
            <span>cách khám phá mới.</span>
          </h2>
          <p>
            Bộ sản phẩm kết nối trò chơi và những câu chuyện địa danh. Quét QR
            trên sản phẩm để mở lối đến nội dung và trải nghiệm AR ngay trên
            web.
          </p>
          <div className="home-ar__steps">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div className="home-ar__step" key={number}>
                <span className="home-ar__step-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="home-ar__step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            as={Link}
            to="/products"
            size="lg"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            iconPosition="right"
          >
            Tới trang AR ngay
          </Button>
        </div>
      </section>

      <section className="home-final-cta" aria-label="Khám phá cửa hàng">
        <div className="home-final-cta__flower-group" aria-hidden="true">
          <img className="home-final-cta__flower" src={flowerImage} alt="" />
        </div>
        <div>
          <p className="home-eyebrow">Mang câu chuyện Việt về nhà</p>
          <h2>Một hành trình đang chờ bạn.</h2>
        </div>
        <Button
          as={Link}
          to="/products"
          icon={<ArrowRight size={18} aria-hidden="true" />}
          iconPosition="right"
        >
          Cùng đi tới những miền di sản thôi!
        </Button>
      </section>
    </div>
  );
}

export default HomePage;

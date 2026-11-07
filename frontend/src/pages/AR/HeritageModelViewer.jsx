import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const VIEWER_BACKGROUND = 0x17131f;
const VIEWER_ZOOM_MIN = 0.65;
const VIEWER_ZOOM_MAX = 5;
const VIEWER_ZOOM_STEP = 0.2;
const AUTO_ROTATION_SPEED = 0.32;

const createSoftShadowTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.58)");
  gradient.addColorStop(0.42, "rgba(0, 0, 0, 0.38)");
  gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.16)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const disposeObject3D = (root) => {
  root?.traverse((object) => {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose?.();
    });
  });
};

function HeritageModelViewer({ model, name }) {
  const containerRef = useRef(null);
  const modelPivotRef = useRef(null);
  const cameraRef = useRef(null);
  const zoomRef = useRef(1);
  const [attempt, setAttempt] = useState(0);
  const [viewerState, setViewerState] = useState({
    status: "loading",
    progress: null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !model?.url) return undefined;

    let active = true;
    let animationFrame = null;
    let loadedModel = null;
    let groundShadow = null;
    let environmentSphere = null;
    let environmentTexture = null;
    let environmentRenderTarget = null;
    let mixer = null;
    const autoRotationEnabled = !window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEWER_BACKGROUND);
    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    modelPivotRef.current = modelPivot;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    camera.position.set(1.6, 1.05, 2.4);
    cameraRef.current = camera;
    zoomRef.current = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const pointers = new Map();
    let isPointerInteracting = false;
    let previousPointerX = null;
    let previousPinchDistance = null;
    const applyZoom = (nextZoom) => {
      const zoom = THREE.MathUtils.clamp(
        nextZoom,
        VIEWER_ZOOM_MIN,
        VIEWER_ZOOM_MAX,
      );
      zoomRef.current = zoom;
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    };
    const handlePointerDown = (event) => {
      if (!loadedModel) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      isPointerInteracting = true;
      if (pointers.size === 1) previousPointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size >= 2) {
        const [first, second] = [...pointers.values()];
        const pinchDistance = Math.hypot(
          first.x - second.x,
          first.y - second.y,
        );
        if (previousPinchDistance) {
          applyZoom(zoomRef.current * (pinchDistance / previousPinchDistance));
        }
        previousPinchDistance = pinchDistance;
        return;
      }

      if (previousPointerX === null) previousPointerX = event.clientX;
      modelPivot.rotation.y += (event.clientX - previousPointerX) * 0.01;
      previousPointerX = event.clientX;
    };
    const handlePointerEnd = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      previousPinchDistance = null;
      const [remainingPointer] = pointers.values();
      previousPointerX = remainingPointer?.x ?? null;
      isPointerInteracting = pointers.size > 0;
    };
    const handleWheel = (event) => {
      if (!loadedModel) return;
      event.preventDefault();
      applyZoom(zoomRef.current - event.deltaY * 0.0015);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerEnd);
    renderer.domElement.addEventListener("pointercancel", handlePointerEnd);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    if (model.environmentUrl) {
      new THREE.TextureLoader().load(
        model.environmentUrl,
        (texture) => {
          if (!active) {
            texture.dispose();
            return;
          }

          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          environmentTexture = texture;

          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          pmremGenerator.compileEquirectangularShader();
          environmentRenderTarget = pmremGenerator.fromEquirectangular(texture);
          scene.environment = environmentRenderTarget.texture;
          pmremGenerator.dispose();

          texture.mapping = THREE.UVMapping;
          texture.needsUpdate = true;
          environmentSphere = new THREE.Mesh(
            new THREE.SphereGeometry(50, 64, 32),
            new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.BackSide,
              toneMapped: false,
            }),
          );
          environmentSphere.rotation.x = model.environmentPitch || 0;
          environmentSphere.frustumCulled = false;
          scene.add(environmentSphere);
        },
        undefined,
        () => {
          // Keep the dark viewer background when the optional environment fails.
        },
      );
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6d5875, 2.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffd9ef, 2);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    dracoLoader.setWorkerLimit(2);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      model.url,
      (gltf) => {
        if (!active) {
          disposeObject3D(gltf.scene);
          return;
        }

        loadedModel = gltf.scene;
        const rotation = model.rotation || {};
        loadedModel.rotation.set(
          rotation.x || 0,
          rotation.y || 0,
          rotation.z || 0,
        );
        loadedModel.updateMatrixWorld(true);

        const sourceBox = new THREE.Box3().setFromObject(loadedModel);
        const sourceSize = sourceBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);
        if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
          disposeObject3D(loadedModel);
          loadedModel = null;
          setViewerState({ status: "error", progress: null });
          return;
        }

        loadedModel.scale.multiplyScalar(1.45 / maxDimension);
        loadedModel.updateMatrixWorld(true);
        const normalizedBox = new THREE.Box3().setFromObject(loadedModel);
        const center = normalizedBox.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center);
        loadedModel.updateMatrixWorld(true);
        modelPivot.add(loadedModel);

        const centeredBox = new THREE.Box3().setFromObject(loadedModel);
        const centeredSize = centeredBox.getSize(new THREE.Vector3());
        const hasEnvironment = Boolean(model.environmentUrl);
        const floorOffset = Math.max(centeredSize.y * 0.015, 0.01);
        const floorY = centeredBox.min.y - floorOffset;
        const shadowDiameter = Math.max(
          centeredSize.x,
          centeredSize.z,
          0.75,
        ) * 1.35;
        groundShadow = new THREE.Mesh(
          new THREE.PlaneGeometry(shadowDiameter, shadowDiameter),
          new THREE.MeshBasicMaterial({
            map: createSoftShadowTexture(),
            transparent: true,
            opacity: hasEnvironment ? 0.52 : 0.72,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        groundShadow.rotation.x = -Math.PI / 2;
        groundShadow.position.y = floorY;
        groundShadow.renderOrder = -1;
        modelPivot.add(groundShadow);

        const sphere = normalizedBox.getBoundingSphere(new THREE.Sphere());
        const radius = Math.max(sphere.radius, 0.35);
        camera.position.set(radius * 1.8, radius * 1.15, radius * 2.7);
        camera.lookAt(0, 0, 0);

        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(loadedModel);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
        setViewerState({ status: "ready", progress: 100 });
      },
      (event) => {
        if (!active) return;
        const progress = event.total > 0
          ? Math.min(99, Math.round((event.loaded / event.total) * 100))
          : null;
        setViewerState({ status: "loading", progress });
      },
      () => {
        if (active) setViewerState({ status: "error", progress: null });
      },
    );

    const render = () => {
      animationFrame = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.1);
      mixer?.update(delta);
      if (loadedModel && autoRotationEnabled && !isPointerInteracting) {
        modelPivot.rotation.y += AUTO_ROTATION_SPEED * delta;
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      active = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerEnd);
      renderer.domElement.removeEventListener("pointercancel", handlePointerEnd);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      modelPivotRef.current = null;
      cameraRef.current = null;
      mixer?.stopAllAction();
      disposeObject3D(loadedModel);
      disposeObject3D(groundShadow);
      environmentSphere?.geometry.dispose();
      environmentSphere?.material.dispose();
      environmentRenderTarget?.dispose();
      environmentTexture?.dispose();
      dracoLoader.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [attempt, model]);

  const rotate = (angle) => {
    if (!modelPivotRef.current) return;
    modelPivotRef.current.rotation.y += angle;
  };

  const zoom = (delta) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const nextZoom = THREE.MathUtils.clamp(
      zoomRef.current + delta,
      VIEWER_ZOOM_MIN,
      VIEWER_ZOOM_MAX,
    );
    zoomRef.current = nextZoom;
    camera.zoom = nextZoom;
    camera.updateProjectionMatrix();
  };

  return (
    <section
      className="ar-model-viewer"
      aria-label={`Mô hình 3D ${name}`}
    >
      <div className="ar-model-viewer__canvas" ref={containerRef} />

      {viewerState.status === "loading" && (
        <div className="ar-model-viewer__state" role="status">
          <span className="ar-model-viewer__spinner" aria-hidden="true" />
          <strong>Đang tải mô hình 3D</strong>
          <span>
            {Number.isFinite(viewerState.progress)
              ? `${viewerState.progress}%`
              : "Đang chuẩn bị dữ liệu…"}
          </span>
        </div>
      )}

      {viewerState.status === "error" && (
        <div className="ar-model-viewer__state" role="alert">
          <strong>Không tải được mô hình 3D</strong>
          <span>Hãy kiểm tra kết nối rồi thử lại.</span>
          <button
            type="button"
            onClick={() => {
              setViewerState({ status: "loading", progress: null });
              setAttempt((current) => current + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {viewerState.status === "ready" && (
        <>
          <p className="ar-model-viewer__hint">
            Tự xoay · Kéo để xoay · Chụm/mở hoặc cuộn để thu phóng
          </p>
          <div className="ar-model-viewer__controls" aria-label="Điều khiển mô hình 3D">
            <button type="button" onClick={() => rotate(Math.PI / 8)} aria-label="Xoay mô hình sang trái">
              <RotateCcw size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(-Math.PI / 8)} aria-label="Xoay mô hình sang phải">
              <RotateCw size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => zoom(VIEWER_ZOOM_STEP)}
              aria-label="Phóng to mô hình"
              title="Phóng to"
            >
              <ZoomIn size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => zoom(-VIEWER_ZOOM_STEP)}
              aria-label="Thu nhỏ mô hình"
              title="Thu nhỏ"
            >
              <ZoomOut size={19} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default HeritageModelViewer;

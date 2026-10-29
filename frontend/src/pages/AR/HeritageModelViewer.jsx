import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const UP_AXIS = new THREE.Vector3(0, 1, 0);

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
  const controlsRef = useRef(null);
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
    let mixer = null;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f4ec);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    camera.position.set(1.6, 1.05, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.45;
    controls.maxDistance = 8;
    controls.target.set(0, 0.15, 0);
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    controls.update();
    controlsRef.current = { camera, controls };

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
        scene.add(loadedModel);

        const sphere = normalizedBox.getBoundingSphere(new THREE.Sphere());
        const radius = Math.max(sphere.radius, 0.35);
        controls.minDistance = radius * 1.15;
        controls.maxDistance = radius * 8;
        camera.position.set(radius * 1.8, radius * 1.15, radius * 2.7);
        controls.target.set(0, 0, 0);
        controls.update();

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
      mixer?.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      active = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      controlsRef.current = null;
      mixer?.stopAllAction();
      disposeObject3D(loadedModel);
      dracoLoader.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [attempt, model]);

  const zoom = (factor) => {
    const activeControls = controlsRef.current;
    if (!activeControls) return;
    const { camera, controls } = activeControls;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance,
    );
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
  };

  const rotate = (angle) => {
    const activeControls = controlsRef.current;
    if (!activeControls) return;
    const { camera, controls } = activeControls;
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(UP_AXIS, angle);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
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
            Kéo để xoay · Chụm hai ngón hoặc cuộn để thu phóng
          </p>
          <div className="ar-model-viewer__controls" aria-label="Điều khiển mô hình 3D">
            <button type="button" onClick={() => rotate(Math.PI / 8)} aria-label="Xoay mô hình sang trái">
              <RotateCcw size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(-Math.PI / 8)} aria-label="Xoay mô hình sang phải">
              <RotateCw size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoom(0.82)} aria-label="Phóng to mô hình">
              <ZoomIn size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoom(1.22)} aria-label="Thu nhỏ mô hình">
              <ZoomOut size={19} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default HeritageModelViewer;

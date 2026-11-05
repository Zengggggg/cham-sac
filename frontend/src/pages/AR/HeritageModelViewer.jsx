import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const VIEWER_BACKGROUND = 0x17131f;
const GRID_AXIS_COLOR = 0xffd166;
const GRID_LINE_COLOR = 0xb8aec4;

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
    let gridHelper = null;
    let environmentSphere = null;
    let environmentTexture = null;
    let environmentRenderTarget = null;
    let mixer = null;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEWER_BACKGROUND);
    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    modelPivotRef.current = modelPivot;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    camera.position.set(1.6, 1.05, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    let activePointerId = null;
    let previousPointerX = 0;
    const handlePointerDown = (event) => {
      if (!loadedModel) return;
      activePointerId = event.pointerId;
      previousPointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event) => {
      if (activePointerId !== event.pointerId) return;
      const deltaX = event.clientX - previousPointerX;
      previousPointerX = event.clientX;
      modelPivot.rotation.y += deltaX * 0.01;
    };
    const handlePointerEnd = (event) => {
      if (activePointerId !== event.pointerId) return;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      activePointerId = null;
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerEnd);
    renderer.domElement.addEventListener("pointercancel", handlePointerEnd);

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
          modelPivot.add(environmentSphere);
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
        const gridSize = hasEnvironment
          ? Math.max(centeredSize.x, centeredSize.z, 0.75) * 1.2
          : Math.ceil(Math.max(centeredSize.x, centeredSize.z, 1) * 4.8) / 2;
        const floorOffset = Math.max(centeredSize.y * 0.015, 0.01);
        const floorY = hasEnvironment
          ? centeredBox.min.y
          : centeredBox.min.y - floorOffset;

        gridHelper = new THREE.GridHelper(
          gridSize,
          hasEnvironment ? 6 : 12,
          GRID_AXIS_COLOR,
          GRID_LINE_COLOR,
        );
        gridHelper.position.y = floorY + 0.002;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = hasEnvironment ? 0.44 : 0.86;
        gridHelper.material.depthWrite = false;
        modelPivot.add(gridHelper);

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
      mixer?.update(clock.getDelta());
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
      modelPivotRef.current = null;
      mixer?.stopAllAction();
      disposeObject3D(loadedModel);
      disposeObject3D(gridHelper);
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
            Kéo ngang để xoay mô hình
          </p>
          <div className="ar-model-viewer__controls" aria-label="Điều khiển mô hình 3D">
            <button type="button" onClick={() => rotate(Math.PI / 8)} aria-label="Xoay mô hình sang trái">
              <RotateCcw size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(-Math.PI / 8)} aria-label="Xoay mô hình sang phải">
              <RotateCw size={19} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default HeritageModelViewer;

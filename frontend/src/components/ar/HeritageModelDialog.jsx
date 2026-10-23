import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, LoaderCircle, MapPin, Minus, Plus, RotateCcw, ScanLine, X } from 'lucide-react'

const initialLoadState = { status: 'loading', progress: null, message: null }

const disposeScene = (scene) => {
  scene?.traverse((child) => {
    child.geometry?.dispose?.()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => value?.isTexture && value.dispose())
      material.dispose?.()
    })
  })
}

function HeritageModelDialog({ experience, onClose, onScanAgain }) {
  const dialogRef = useRef(null)
  const viewerRef = useRef(null)
  const controlsRef = useRef(null)
  const cameraRef = useRef(null)
  const orbitRef = useRef(null)
  const [loadState, setLoadState] = useState(() => (
    experience.model?.url
      ? initialLoadState
      : { status: 'unavailable', progress: null, message: 'Địa danh này chưa có mô hình 3D. Bạn vẫn có thể đọc toàn bộ câu chuyện bên cạnh.' }
  ))

  const resetView = useCallback(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(2.15, 1.45, 3.25)
    controls.target.set(0, 0, 0)
    controls.update()
  }, [])

  const zoomView = useCallback((factor) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const offset = camera.position.clone().sub(controls.target)
    const nextDistance = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor))
    camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(nextDistance))
    controls.update()
  }, [])

  const orbitView = useCallback((deltaTheta, deltaPhi) => {
    orbitRef.current?.(deltaTheta, deltaPhi)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    dialog.showModal()
    requestAnimationFrame(() => viewerRef.current?.focus())

    const handleCancel = (event) => {
      event.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  useEffect(() => {
    const host = viewerRef.current
    if (!host) return undefined
    if (!experience.model?.url) return undefined

    let active = true
    let frameId = null
    let resizeObserver = null
    let renderer = null
    let scene = null
    let controls = null
    let dracoLoader = null
    let mixer = null
    let clock = null

    const initialize = async () => {
      try {
        const [THREE, { GLTFLoader }, { DRACOLoader }, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/loaders/DRACOLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
        ])
        if (!active || !viewerRef.current) return

        scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100)
        cameraRef.current = camera

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        renderer.domElement.setAttribute('aria-hidden', 'true')
        host.prepend(renderer.domElement)

        controls = new OrbitControls(camera, renderer.domElement)
        controlsRef.current = controls
        controls.enableDamping = true
        controls.enablePan = false
        controls.minDistance = 1.35
        controls.maxDistance = 6
        controls.minPolarAngle = 0.16
        controls.maxPolarAngle = Math.PI - 0.16
        controls.zoomToCursor = true
        resetView()

        orbitRef.current = (deltaTheta, deltaPhi) => {
          const offset = camera.position.clone().sub(controls.target)
          const spherical = new THREE.Spherical().setFromVector3(offset)
          spherical.theta += deltaTheta
          spherical.phi = Math.min(Math.PI - 0.16, Math.max(0.16, spherical.phi + deltaPhi))
          camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical))
          controls.update()
        }

        scene.add(new THREE.HemisphereLight(0xfff8ed, 0x5d4255, 2.6))
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
        keyLight.position.set(-3, 5, 4)
        scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(0xffd6e7, 1.7)
        fillLight.position.set(4, 1, -2)
        scene.add(fillLight)

        const loader = new GLTFLoader()
        dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('/draco/')
        dracoLoader.setWorkerLimit(2)
        loader.setDRACOLoader(dracoLoader)
        loader.load(
          experience.model.url,
          (gltf) => {
            if (!active) {
              disposeScene(gltf.scene)
              return
            }

            try {
              const box = new THREE.Box3().setFromObject(gltf.scene)
              const size = box.getSize(new THREE.Vector3())
              const maxDimension = Math.max(size.x, size.y, size.z)
              if (!Number.isFinite(maxDimension) || maxDimension <= 0) throw new Error('Mô hình không có kích thước hợp lệ.')

              gltf.scene.scale.setScalar(2.15 / maxDimension)
              gltf.scene.updateMatrixWorld(true)
              const normalizedBox = new THREE.Box3().setFromObject(gltf.scene)
              const center = normalizedBox.getCenter(new THREE.Vector3())
              gltf.scene.position.sub(center)
              scene.add(gltf.scene)

              if (gltf.animations?.length) {
                mixer = new THREE.AnimationMixer(gltf.scene)
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
              }

              setLoadState({ status: 'ready', progress: 100, message: null })
            } catch (modelError) {
              console.error('Không thể chuẩn hóa mô hình 3D', modelError)
              disposeScene(gltf.scene)
              setLoadState({ status: 'error', progress: null, message: 'Mô hình 3D không có dữ liệu hiển thị hợp lệ.' })
            }
          },
          (event) => {
            if (!active) return
            const progress = event.total > 0 ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : null
            setLoadState({ status: 'loading', progress, message: null })
          },
          (loadError) => {
            console.error('Không thể tải mô hình 3D', loadError)
            if (active) setLoadState({ status: 'error', progress: null, message: 'Không tải được mô hình 3D. Hãy kiểm tra kết nối rồi thử lại.' })
          },
        )

        const resize = () => {
          if (!renderer) return
          const width = Math.max(host.clientWidth, 1)
          const height = Math.max(host.clientHeight, 1)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height, false)
        }
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(host)
        resize()

        clock = new THREE.Clock()
        const render = () => {
          if (!active) return
          frameId = requestAnimationFrame(render)
          mixer?.update(clock.getDelta())
          controls.update()
          renderer.render(scene, camera)
        }
        render()
      } catch (viewerError) {
        console.error('Không thể khởi tạo trình xem 3D', viewerError)
        if (active) setLoadState({ status: 'error', progress: null, message: 'Thiết bị chưa thể mở trình xem 3D. Hãy thử lại hoặc đọc nội dung địa danh.' })
      }
    }

    void initialize()

    return () => {
      active = false
      if (frameId) cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      mixer?.stopAllAction()
      controls?.dispose()
      dracoLoader?.dispose()
      disposeScene(scene)
      renderer?.dispose()
      renderer?.domElement?.remove()
      controlsRef.current = null
      cameraRef.current = null
      orbitRef.current = null
    }
  }, [experience, resetView])

  const handleViewerKeyDown = (event) => {
    const actions = {
      ArrowLeft: () => orbitView(-0.12, 0),
      ArrowRight: () => orbitView(0.12, 0),
      ArrowUp: () => orbitView(0, -0.1),
      ArrowDown: () => orbitView(0, 0.1),
      '+': () => zoomView(0.84),
      '=': () => zoomView(0.84),
      '-': () => zoomView(1.18),
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  const progressLabel = Number.isFinite(loadState.progress) ? `${loadState.progress}%` : 'Đang tải'

  return (
    <dialog
      className="ar-result-dialog"
      ref={dialogRef}
      aria-labelledby="ar-result-title"
      onClick={(event) => event.target === dialogRef.current && onClose()}
    >
      <div className="ar-result-card">
        <header className="ar-result-card__header">
          <div>
            <span className="ar-result-card__status"><span aria-hidden="true" /> Đã nhận diện · Camera đã tắt</span>
            <h2 id="ar-result-title">{experience.name}</h2>
            <p><MapPin size={16} aria-hidden="true" /> {experience.location}</p>
          </div>
          <button className="ar-icon-button" type="button" onClick={onClose} aria-label="Đóng trình khám phá 3D">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="ar-result-card__layout">
          <section className="ar-model-workbench" aria-label={`Mô hình 3D ${experience.name}`}>
            <div
              className="ar-model-workbench__viewport"
              ref={viewerRef}
              tabIndex={0}
              onKeyDown={handleViewerKeyDown}
              aria-label="Kéo để xoay mô hình, chụm hoặc cuộn để phóng to thu nhỏ. Có thể dùng các phím mũi tên và phím cộng trừ."
            >
              {loadState.status === 'loading' && (
                <div className="ar-model-state" role="status" aria-live="polite">
                  <LoaderCircle className="ar-model-state__spinner" size={30} aria-hidden="true" />
                  <strong>Đang dựng mô hình 3D</strong>
                  <span>{progressLabel}</span>
                  <span className="ar-model-state__progress" aria-hidden="true">
                    <span style={{ transform: `scaleX(${Number.isFinite(loadState.progress) ? loadState.progress / 100 : 0.28})` }} />
                  </span>
                </div>
              )}
              {['error', 'unavailable'].includes(loadState.status) && (
                <div className="ar-model-state ar-model-state--error" role="alert">
                  <AlertTriangle size={30} aria-hidden="true" />
                  <strong>{loadState.status === 'unavailable' ? 'Chưa có mô hình 3D' : 'Không mở được mô hình'}</strong>
                  <span>{loadState.message}</span>
                  <img src={experience.targetImage} alt={`Thẻ địa danh ${experience.name}`} />
                </div>
              )}
            </div>

            <div className="ar-model-workbench__controls" aria-label="Điều khiển mô hình 3D">
              <button type="button" onClick={resetView} disabled={loadState.status !== 'ready'}>
                <RotateCcw size={17} aria-hidden="true" /> Đặt lại
              </button>
              <button type="button" onClick={() => zoomView(1.18)} disabled={loadState.status !== 'ready'} aria-label="Thu nhỏ mô hình">
                <Minus size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => zoomView(0.84)} disabled={loadState.status !== 'ready'} aria-label="Phóng to mô hình">
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="ar-model-workbench__hint">Kéo để xoay · Chụm hoặc cuộn để thu phóng</p>
          </section>

          <article className="ar-result-story">
            <p className="ar-result-story__tagline">{experience.tagline}</p>
            <p className="ar-result-story__summary">{experience.shortDescription}</p>
            <div className="ar-result-story__body">
              <h3><BookOpen size={18} aria-hidden="true" /> Câu chuyện địa danh</h3>
              {experience.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <button className="ar-button ar-button--primary ar-result-story__scan" type="button" onClick={onScanAgain}>
              <ScanLine size={19} aria-hidden="true" /> Quét thẻ khác
            </button>
          </article>
        </div>
      </div>
    </dialog>
  )
}

export default HeritageModelDialog

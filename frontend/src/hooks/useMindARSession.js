import { useCallback, useEffect, useRef, useState } from 'react'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'

const idleModelState = { targetIndex: null, status: 'idle', progress: 0, message: null }
const idleCaptureState = { status: 'idle', imageUrl: null }
const CAPTURE_ANIMATION_MIN_MS = 2400

const captureVideoFrame = (video) => {
  if (!video?.videoWidth || !video?.videoHeight) return null

  const maxWidth = 1280
  const scale = Math.min(1, maxWidth / video.videoWidth)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) return null

  try {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.86)
  } catch {
    return null
  }
}

const getSupportStatus = () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || !window.WebGLRenderingContext) return 'unsupported'
  if (!window.isSecureContext) return 'insecure'
  return 'idle'
}

const getARSessionError = async (error) => {
  let permissionState = null
  try {
    permissionState = await navigator.permissions?.query({ name: 'camera' })
  } catch {
    // Safari does not currently expose the camera permission through Permissions API.
  }

  if (permissionState?.state === 'denied' || error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return { code: 'permission-denied', message: 'Quyền camera đang bị từ chối. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại.' }
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return { code: 'camera-unavailable', message: 'Không tìm thấy camera phù hợp trên thiết bị này.' }
  }
  if (error?.name === 'NotReadableError' || error?.name === 'AbortError') {
    return { code: 'camera-busy', message: 'Camera đang được ứng dụng khác sử dụng hoặc chưa thể khởi động.' }
  }
  return { code: 'ar-start-failed', message: 'Không thể khởi động bộ nhận diện AR. Hãy tải lại trang và thử lại.' }
}

const createRoundedRectangle = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

const createTargetBadge = (THREE, experience) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 280
  const context = canvas.getContext('2d')

  context.fillStyle = 'rgba(28, 13, 27, 0.9)'
  createRoundedRectangle(context, 12, 12, 1000, 256, 44)
  context.fillStyle = '#ff86bd'
  context.font = '700 38px sans-serif'
  context.fillText('CHẠM SẮC VIỆT • ĐÃ NHẬN DIỆN', 56, 82)
  context.fillStyle = '#ffffff'
  context.font = '800 68px sans-serif'
  context.fillText(experience.name, 56, 174, 900)
  context.fillStyle = '#f8d5e5'
  context.font = '500 34px sans-serif'
  context.fillText(experience.location, 56, 226, 900)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const geometry = new THREE.PlaneGeometry(1.08, 0.295)
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, -0.45, 0.035)
  return { mesh, resources: [texture, geometry, material] }
}

const disposeObject3D = (root) => {
  root?.traverse((child) => {
    child.geometry?.dispose?.()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => value?.isTexture && value.dispose())
      material.dispose?.()
    })
  })
}

const prepareModel = (THREE, gltf, config) => {
  const modelScene = gltf.scene
  const initialBox = new THREE.Box3().setFromObject(modelScene)
  const initialSize = initialBox.getSize(new THREE.Vector3())
  const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z)
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) throw new Error('Model 3D không có kích thước hợp lệ.')

  const configuredScale = Number.isFinite(config.scale) && config.scale > 0 ? config.scale : 1
  modelScene.scale.setScalar((0.82 / maxDimension) * configuredScale)
  modelScene.updateMatrixWorld(true)

  const normalizedBox = new THREE.Box3().setFromObject(modelScene)
  const center = normalizedBox.getCenter(new THREE.Vector3())
  modelScene.position.x -= center.x
  modelScene.position.y -= normalizedBox.min.y
  modelScene.position.z -= center.z

  const wrapper = new THREE.Group()
  const position = config.position || {}
  const rotation = config.rotation || {}
  wrapper.position.set(position.x || 0, position.y || 0, position.z || 0.02)
  wrapper.rotation.set(Math.PI / 2 + (rotation.x || 0), rotation.y || 0, rotation.z || 0)
  wrapper.add(modelScene)
  return { wrapper, modelScene }
}

export default function useMindARSession(experiences = HERITAGE_EXPERIENCES) {
  const containerRef = useRef(null)
  const mindARRef = useRef(null)
  const resourcesRef = useRef([])
  const modelEntriesRef = useRef(new Map())
  const loadModelRef = useRef(null)
  const captureFlowRef = useRef(null)
  const captureImageRef = useRef(null)
  const captureStatusRef = useRef('idle')
  const capturedTargetIndexRef = useRef(null)
  const recognizedExperienceRef = useRef(null)
  const sessionIdRef = useRef(0)
  const mountedRef = useRef(true)
  const activeTargetIndexRef = useRef(null)
  const [status, setStatus] = useState(getSupportStatus)
  const [error, setError] = useState(null)
  const [recognizedExperience, setRecognizedExperience] = useState(null)
  const [modelState, setModelState] = useState(idleModelState)
  const [captureState, setCaptureState] = useState(idleCaptureState)

  const updateCaptureState = useCallback((nextState) => {
    captureStatusRef.current = nextState.status
    captureImageRef.current = nextState.imageUrl
    setCaptureState(nextState)
  }, [])

  const releaseSession = useCallback(() => {
    sessionIdRef.current += 1
    activeTargetIndexRef.current = null
    capturedTargetIndexRef.current = null
    recognizedExperienceRef.current = null
    loadModelRef.current = null
    captureFlowRef.current = null
    captureStatusRef.current = 'idle'
    captureImageRef.current = null

    modelEntriesRef.current.forEach((entry) => {
      entry.mixer?.stopAllAction()
      if (entry.modelScene) disposeObject3D(entry.modelScene)
    })
    modelEntriesRef.current.clear()

    const mindAR = mindARRef.current
    mindARRef.current = null
    if (mindAR) {
      mindAR.renderer?.setAnimationLoop(null)
      try {
        if (mindAR.controller && mindAR.video?.srcObject) mindAR.stop()
        else {
          mindAR.video?.srcObject?.getTracks().forEach((track) => track.stop())
          mindAR.video?.remove()
        }
      } catch {
        mindAR.video?.srcObject?.getTracks().forEach((track) => track.stop())
      }
      mindAR.renderer?.dispose()
    }

    resourcesRef.current.forEach((resource) => resource.dispose?.())
    resourcesRef.current = []
    containerRef.current?.replaceChildren()
  }, [])

  const stopAR = useCallback(() => {
    releaseSession()
    setError(null)
    setRecognizedExperience(null)
    setModelState(idleModelState)
    setCaptureState(idleCaptureState)
    setStatus(getSupportStatus())
  }, [releaseSession])

  const captureTarget = useCallback(() => {
    const experience = recognizedExperienceRef.current
    if (experience) void captureFlowRef.current?.(experience)
  }, [])

  const retryModel = useCallback(() => {
    const experience = recognizedExperienceRef.current
    if (experience) void captureFlowRef.current?.(experience, true)
  }, [])

  const retakeCapture = useCallback(() => {
    const targetIndex = capturedTargetIndexRef.current
    const entry = targetIndex === null ? null : modelEntriesRef.current.get(targetIndex)
    if (entry?.wrapper) entry.wrapper.visible = false
    if (entry?.badge) entry.badge.visible = true

    capturedTargetIndexRef.current = null
    updateCaptureState(idleCaptureState)
    setModelState(idleModelState)
    setStatus(recognizedExperienceRef.current ? 'recognized' : 'scanning')
  }, [updateCaptureState])

  const startAR = useCallback(async () => {
    const supportStatus = getSupportStatus()
    if (supportStatus !== 'idle') {
      setStatus(supportStatus)
      return
    }
    if (!containerRef.current) return

    releaseSession()
    const sessionId = sessionIdRef.current + 1
    sessionIdRef.current = sessionId
    setError(null)
    setRecognizedExperience(null)
    setModelState(idleModelState)
    updateCaptureState(idleCaptureState)
    setStatus('loading')

    try {
      const [{ MindARThree }, THREE, { GLTFLoader }] = await Promise.all([
        import('mind-ar/dist/mindar-image-three.prod.js'),
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
      ])
      if (!mountedRef.current || sessionId !== sessionIdRef.current || !containerRef.current) return

      const mindAR = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: targetBundleUrl,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        warmupTolerance: 5,
        missTolerance: 5,
      })
      mindARRef.current = mindAR

      mindAR.scene.add(new THREE.HemisphereLight(0xffffff, 0x5b4058, 2.2))
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
      keyLight.position.set(-1, 2, 3)
      mindAR.scene.add(keyLight)

      const loader = new GLTFLoader()
      loadModelRef.current = async (experience, force = false) => {
        const entry = modelEntriesRef.current.get(experience.targetIndex)
        if (!entry || !experience.model?.url) {
          if (activeTargetIndexRef.current === experience.targetIndex || capturedTargetIndexRef.current === experience.targetIndex) {
            setModelState({ targetIndex: experience.targetIndex, status: 'unavailable', progress: 0, message: 'Địa danh này chưa có model 3D.' })
          }
          return false
        }
        if (entry.status === 'ready') {
          return true
        }
        if (entry.status === 'loading' && !force) return entry.promise

        entry.status = 'loading'
        if (activeTargetIndexRef.current === experience.targetIndex) {
          setModelState({ targetIndex: experience.targetIndex, status: 'loading', progress: 0, message: null })
        }

        entry.promise = new Promise((resolve, reject) => {
          loader.load(
            experience.model.url,
            resolve,
            (event) => {
              const isCurrentTarget = activeTargetIndexRef.current === experience.targetIndex
                || capturedTargetIndexRef.current === experience.targetIndex
              if (!isCurrentTarget || sessionId !== sessionIdRef.current) return
              const progress = event.total > 0 ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : null
              setModelState({ targetIndex: experience.targetIndex, status: 'loading', progress, message: null })
            },
            reject,
          )
        })

        try {
          const gltf = await entry.promise
          if (!mountedRef.current || sessionId !== sessionIdRef.current) {
            disposeObject3D(gltf.scene)
            return
          }
          const { wrapper, modelScene } = prepareModel(THREE, gltf, experience.model)
          wrapper.visible = false
          entry.anchor.group.add(wrapper)
          entry.wrapper = wrapper
          entry.modelScene = modelScene
          entry.status = 'ready'
          if (gltf.animations?.length) {
            entry.mixer = new THREE.AnimationMixer(modelScene)
            gltf.animations.forEach((clip) => entry.mixer.clipAction(clip).play())
          }
          return true
        } catch (modelError) {
          console.error('Không thể tải model AR', modelError)
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return
          entry.status = 'error'
          entry.promise = null
          if (activeTargetIndexRef.current === experience.targetIndex || capturedTargetIndexRef.current === experience.targetIndex) {
            setModelState({ targetIndex: experience.targetIndex, status: 'error', progress: 0, message: 'Không tải được model 3D. Hãy kiểm tra kết nối rồi thử lại.' })
          }
          return false
        }
      }

      captureFlowRef.current = async (experience, force = false) => {
        if (captureStatusRef.current === 'loading' && !force) return

        const imageUrl = captureImageRef.current || captureVideoFrame(mindAR.video)
        if (!imageUrl) {
          setModelState({ targetIndex: experience.targetIndex, status: 'error', progress: 0, message: 'Không thể chụp khung hình camera. Hãy thử lại.' })
          return
        }

        capturedTargetIndexRef.current = experience.targetIndex
        const entry = modelEntriesRef.current.get(experience.targetIndex)
        if (entry?.badge) entry.badge.visible = false
        updateCaptureState({ status: 'loading', imageUrl })
        setStatus('captured')
        setModelState({ targetIndex: experience.targetIndex, status: 'loading', progress: 0, message: null })

        const minimumAnimation = new Promise((resolve) => {
          window.setTimeout(resolve, CAPTURE_ANIMATION_MIN_MS)
        })
        const [modelReady] = await Promise.all([
          loadModelRef.current?.(experience, force),
          minimumAnimation,
        ])

        if (!mountedRef.current || sessionId !== sessionIdRef.current) return
        if (!modelReady || !entry?.wrapper) {
          updateCaptureState({ status: 'error', imageUrl })
          return
        }

        entry.wrapper.visible = true
        entry.anchor.group.visible = true
        updateCaptureState({ status: 'revealing', imageUrl })
        setModelState({ targetIndex: experience.targetIndex, status: 'ready', progress: 100, message: null })

        window.setTimeout(() => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return
          updateCaptureState({ status: 'ready', imageUrl })
        }, 700)
      }

      experiences.forEach((experience) => {
        const anchor = mindAR.addAnchor(experience.targetIndex)
        const { mesh, resources } = createTargetBadge(THREE, experience)
        resourcesRef.current.push(...resources)
        anchor.group.add(mesh)
        modelEntriesRef.current.set(experience.targetIndex, { anchor, badge: mesh, status: 'idle', promise: null, wrapper: null, modelScene: null, mixer: null })

        anchor.onTargetFound = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return
          activeTargetIndexRef.current = experience.targetIndex
          recognizedExperienceRef.current = experience
          setRecognizedExperience(experience)
          setStatus('recognized')
        }
        anchor.onTargetLost = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current || activeTargetIndexRef.current !== experience.targetIndex) return
          if (capturedTargetIndexRef.current === experience.targetIndex) return
          activeTargetIndexRef.current = null
          recognizedExperienceRef.current = null
          setRecognizedExperience(null)
          setModelState(idleModelState)
          setStatus('scanning')
        }
      })

      await mindAR.start()
      if (!mountedRef.current || sessionId !== sessionIdRef.current) {
        releaseSession()
        return
      }

      const clock = new THREE.Clock()
      mindAR.renderer.setAnimationLoop(() => {
        const delta = clock.getDelta()
        modelEntriesRef.current.forEach((entry) => entry.mixer?.update(delta))
        const capturedEntry = modelEntriesRef.current.get(capturedTargetIndexRef.current)
        if (capturedEntry) capturedEntry.anchor.group.visible = true
        mindAR.renderer.render(mindAR.scene, mindAR.camera)
      })
      setStatus('scanning')
    } catch (sessionError) {
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return
      releaseSession()
      setError(await getARSessionError(sessionError))
      setStatus('error')
    }
  }, [experiences, releaseSession, updateCaptureState])

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === 'hidden' && mindARRef.current) stopAR()
    }
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => document.removeEventListener('visibilitychange', stopWhenHidden)
  }, [stopAR])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      releaseSession()
    }
  }, [releaseSession])

  return {
    captureState,
    captureTarget,
    containerRef,
    error,
    modelState,
    recognizedExperience,
    retakeCapture,
    retryModel,
    startAR,
    status,
    stopAR,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'

const MODEL_TARGET_ROTATION_X = Math.PI / 2
const TARGET_LOST_GRACE_MS = 1200

const createIdleModelState = () => ({ status: 'idle', progress: null, message: null })
const createIdleNarrationState = () => ({ status: 'idle', message: null })

const disposeObject3D = (root) => {
  root?.traverse((object) => {
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose()
      })
      material.dispose?.()
    })
  })
}

const normalizeModelForTarget = (model, config = {}) => {
  const rotation = config.rotation || {}
  model.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0)
  model.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) throw new Error('Mô hình không có kích thước hợp lệ.')

  model.scale.multiplyScalar((0.78 / maxDimension) * (config.scale || 1))
  model.updateMatrixWorld(true)

  const normalizedBox = new THREE.Box3().setFromObject(model)
  const center = normalizedBox.getCenter(new THREE.Vector3())
  model.position.set(
    -center.x,
    -normalizedBox.min.y,
    -center.z,
  )
}

const pauseAudio = (audio, { reset = false } = {}) => {
  if (!audio) return
  audio.pause()
  if (!reset) return

  try {
    audio.currentTime = 0
  } catch {
    // Metadata may not be available yet on some mobile browsers.
  }
}

const releaseAudio = (audio) => {
  if (!audio) return
  pauseAudio(audio, { reset: true })
  audio.removeAttribute('src')
  audio.load()
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
    // Safari does not currently expose camera permission through Permissions API.
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

export default function useMindARSession(experiences = HERITAGE_EXPERIENCES) {
  const containerRef = useRef(null)
  const mindARRef = useRef(null)
  const sessionIdRef = useRef(0)
  const mountedRef = useRef(true)
  const recognizedTargetRef = useRef(null)
  const targetLostTimerRef = useRef(null)
  const modelRootsRef = useRef([])
  const mixersRef = useRef([])
  const dracoLoaderRef = useRef(null)
  const audioByTargetRef = useRef(new Map())
  const audioRef = useRef(null)
  const narrationTargetRef = useRef(null)
  const narrationManuallyPausedRef = useRef(false)
  const [status, setStatus] = useState(getSupportStatus)
  const [error, setError] = useState(null)
  const [recognizedExperience, setRecognizedExperience] = useState(null)
  const [modelState, setModelState] = useState(createIdleModelState)
  const [narrationState, setNarrationState] = useState(createIdleNarrationState)

  const playNarration = useCallback(() => {
    const audio = audioRef.current
    const targetIndex = narrationTargetRef.current
    if (!audio || targetIndex === null) return

    if (audio.readyState < 3) {
      setNarrationState({ status: 'loading', message: 'Đang tải thuyết minh…' })
    }

    let playPromise
    try {
      playPromise = audio.play()
    } catch (audioError) {
      console.warn('Không thể bắt đầu phát thuyết minh địa danh.', audioError)
      setNarrationState({ status: 'error', message: 'Không thể phát thuyết minh. Hãy chạm nút loa để thử lại.' })
      return
    }

    playPromise?.catch((audioError) => {
      if (audioRef.current !== audio || narrationTargetRef.current !== targetIndex) return
      if (audioError?.name === 'AbortError') return

      if (audioError?.name === 'NotAllowedError') {
        setNarrationState({
          status: 'blocked',
          message: 'Trình duyệt đã chặn tự động phát. Chạm nút loa để nghe thuyết minh.',
        })
        return
      }

      console.warn('Không thể phát thuyết minh địa danh.', audioError)
      setNarrationState({ status: 'error', message: 'Không thể phát thuyết minh. Hãy chạm nút loa để thử lại.' })
    })
  }, [])

  const toggleNarration = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused || audio.ended) {
      if (audio.ended) audio.currentTime = 0
      narrationManuallyPausedRef.current = false
      playNarration()
      return
    }

    audio.pause()
    narrationManuallyPausedRef.current = true
    setNarrationState({ status: 'paused', message: 'Đã tạm dừng thuyết minh. Chạm nút loa để nghe tiếp.' })
  }, [playNarration])

  const releaseSession = useCallback(() => {
    sessionIdRef.current += 1
    recognizedTargetRef.current = null
    narrationTargetRef.current = null
    narrationManuallyPausedRef.current = false

    if (targetLostTimerRef.current) {
      window.clearTimeout(targetLostTimerRef.current)
      targetLostTimerRef.current = null
    }

    audioRef.current = null
    audioByTargetRef.current.forEach(releaseAudio)
    audioByTargetRef.current.clear()

    mixersRef.current.forEach((mixer) => mixer.stopAllAction())
    mixersRef.current = []
    modelRootsRef.current.forEach(disposeObject3D)
    modelRootsRef.current = []
    dracoLoaderRef.current?.dispose()
    dracoLoaderRef.current = null

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

    containerRef.current?.replaceChildren()
  }, [])

  const stopAR = useCallback(() => {
    releaseSession()
    setError(null)
    setRecognizedExperience(null)
    setModelState(createIdleModelState())
    setNarrationState(createIdleNarrationState())
    setStatus(getSupportStatus())
  }, [releaseSession])

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
    setModelState(createIdleModelState())
    setNarrationState(createIdleNarrationState())
    setStatus('loading')

    // Voice files are small compared with the GLB assets, so prepare them first.
    // Reusing these elements also lets a manual tap reliably recover from autoplay blocking.
    experiences.forEach((experience) => {
      if (!experience.audioUrl) return

      const audio = new Audio(experience.audioUrl)
      audio.preload = 'auto'

      const updateForCurrentTarget = (nextState) => {
        if (
          mountedRef.current
          && sessionId === sessionIdRef.current
          && audioRef.current === audio
          && narrationTargetRef.current === experience.targetIndex
        ) {
          setNarrationState(nextState)
        }
      }

      audio.addEventListener('loadstart', () => {
        updateForCurrentTarget({ status: 'loading', message: 'Đang tải thuyết minh…' })
      })
      audio.addEventListener('canplay', () => {
        if (audio.paused) {
          setNarrationState((current) => {
            if (
              audioRef.current !== audio
              || narrationTargetRef.current !== experience.targetIndex
              || current.status === 'blocked'
            ) return current
            return { status: 'ready', message: 'Thuyết minh đã sẵn sàng.' }
          })
        }
      })
      audio.addEventListener('playing', () => {
        updateForCurrentTarget({ status: 'playing', message: 'Đang phát thuyết minh.' })
      })
      audio.addEventListener('waiting', () => {
        updateForCurrentTarget({ status: 'waiting', message: 'Kết nối chậm, đang tải thêm thuyết minh…' })
      })
      audio.addEventListener('stalled', () => {
        updateForCurrentTarget({ status: 'waiting', message: 'Thuyết minh đang chờ dữ liệu mạng…' })
      })
      audio.addEventListener('ended', () => {
        updateForCurrentTarget({ status: 'ended', message: 'Đã phát xong thuyết minh. Chạm nút loa để nghe lại.' })
      })
      audio.addEventListener('error', () => {
        updateForCurrentTarget({ status: 'error', message: 'Không tải được thuyết minh. Hãy kiểm tra kết nối rồi thử lại.' })
      })

      audioByTargetRef.current.set(experience.targetIndex, audio)
      audio.load()
    })

    try {
      const [{ MindARThree }, { GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import('mind-ar/dist/mindar-image-three.prod.js'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/loaders/DRACOLoader.js'),
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
        missTolerance: 12,
      })
      mindARRef.current = mindAR

      mindAR.scene.add(new THREE.HemisphereLight(0xfff8ed, 0x5d4255, 2.6))
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
      keyLight.position.set(-3, 5, 4)
      mindAR.scene.add(keyLight)

      const loader = new GLTFLoader()
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      dracoLoader.setWorkerLimit(2)
      loader.setDRACOLoader(dracoLoader)
      dracoLoaderRef.current = dracoLoader
      const modelStates = new Map()
      const loadingModelTargets = new Set()

      const updateModelState = (targetIndex, nextState) => {
        if (!mountedRef.current || sessionId !== sessionIdRef.current) return
        modelStates.set(targetIndex, nextState)
        if (recognizedTargetRef.current === targetIndex) setModelState(nextState)
      }

      const loadModelForTarget = (experience, anchor) => {
        if (
          !experience.model?.url
          || modelStates.has(experience.targetIndex)
          || loadingModelTargets.has(experience.targetIndex)
        ) return

        loadingModelTargets.add(experience.targetIndex)
        updateModelState(experience.targetIndex, { status: 'loading', progress: null, message: null })

        loader.load(
          experience.model.url,
          (gltf) => {
            loadingModelTargets.delete(experience.targetIndex)
            if (!mountedRef.current || sessionId !== sessionIdRef.current) {
              disposeObject3D(gltf.scene)
              return
            }

            try {
              normalizeModelForTarget(gltf.scene, experience.model)

              const targetOrientedRoot = new THREE.Group()
              const position = experience.model.position || {}
              targetOrientedRoot.position.set(position.x || 0, position.y || 0, position.z || 0)
              // MindAR targets lie on XY while glTF models are Y-up, so this makes
              // the model stand along the target normal instead of facing the camera.
              targetOrientedRoot.rotation.x = MODEL_TARGET_ROTATION_X
              targetOrientedRoot.add(gltf.scene)
              anchor.group.add(targetOrientedRoot)

              modelRootsRef.current.push(gltf.scene)

              if (gltf.animations?.length) {
                const mixer = new THREE.AnimationMixer(gltf.scene)
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
                mixersRef.current.push(mixer)
              }

              updateModelState(experience.targetIndex, { status: 'ready', progress: 100, message: null })
            } catch (modelError) {
              console.error('Không thể chuẩn hóa mô hình AR', modelError)
              disposeObject3D(gltf.scene)
              updateModelState(experience.targetIndex, {
                status: 'error',
                progress: null,
                message: 'Mô hình 3D không có dữ liệu hiển thị hợp lệ.',
              })
            }
          },
          (event) => {
            const progress = event.total > 0 ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : null
            updateModelState(experience.targetIndex, { status: 'loading', progress, message: null })
          },
          (loadError) => {
            loadingModelTargets.delete(experience.targetIndex)
            console.error('Không thể tải mô hình AR', loadError)
            updateModelState(experience.targetIndex, {
              status: 'error',
              progress: null,
              message: 'Không tải được mô hình 3D. Hãy kiểm tra kết nối rồi thử lại.',
            })
          },
        )
      }

      experiences.forEach((experience) => {
        const anchor = mindAR.addAnchor(experience.targetIndex)
        anchor.onTargetFound = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return

          if (targetLostTimerRef.current) {
            window.clearTimeout(targetLostTimerRef.current)
            targetLostTimerRef.current = null
          }

          const previousTarget = narrationTargetRef.current
          if (previousTarget !== experience.targetIndex) {
            const previousAudio = audioRef.current
            audioRef.current = null
            pauseAudio(previousAudio, { reset: true })
            narrationTargetRef.current = experience.targetIndex
            narrationManuallyPausedRef.current = false
            audioRef.current = audioByTargetRef.current.get(experience.targetIndex) || null
          }

          recognizedTargetRef.current = experience.targetIndex
          setRecognizedExperience(experience)
          setStatus('recognized')

          if (experience.audioUrl && audioRef.current) {
            setNarrationState(audioRef.current.readyState >= 3
              ? { status: 'ready', message: 'Thuyết minh đã sẵn sàng.' }
              : { status: 'loading', message: 'Đang tải thuyết minh…' })
            if (audioRef.current.paused && !narrationManuallyPausedRef.current) playNarration()
          } else {
            setNarrationState(createIdleNarrationState())
          }

          if (!experience.model?.url) {
            setModelState({ status: 'unavailable', progress: null, message: 'Địa danh này chưa có mô hình 3D.' })
            return
          }

          setModelState(modelStates.get(experience.targetIndex) || { status: 'loading', progress: null, message: null })
          loadModelForTarget(experience, anchor)
        }

        anchor.onTargetLost = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current || recognizedTargetRef.current !== experience.targetIndex) return

          if (targetLostTimerRef.current) window.clearTimeout(targetLostTimerRef.current)
          targetLostTimerRef.current = window.setTimeout(() => {
            targetLostTimerRef.current = null
            if (
              !mountedRef.current
              || sessionId !== sessionIdRef.current
              || recognizedTargetRef.current !== experience.targetIndex
            ) return

            recognizedTargetRef.current = null
            pauseAudio(audioRef.current)
            setRecognizedExperience(null)
            setModelState(createIdleModelState())
            setNarrationState({ status: 'paused', message: 'Thuyết minh đã tạm dừng khi mất thẻ.' })
            setStatus('scanning')
          }, TARGET_LOST_GRACE_MS)
        }
      })

      await mindAR.start()
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return

      const clock = new THREE.Clock()
      mindAR.renderer.setAnimationLoop(() => {
        const delta = clock.getDelta()
        mixersRef.current.forEach((mixer) => mixer.update(delta))

        mindAR.renderer.render(mindAR.scene, mindAR.camera)
      })
      setStatus('scanning')
    } catch (sessionError) {
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return
      releaseSession()
      setNarrationState(createIdleNarrationState())
      setError(await getARSessionError(sessionError))
      setStatus('error')
    }
  }, [experiences, playNarration, releaseSession])

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
    containerRef,
    error,
    modelState,
    narrationState,
    recognizedExperience,
    startAR,
    status,
    stopAR,
    toggleNarration,
  }
}

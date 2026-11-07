import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'

const TARGET_LOST_GRACE_MS = 1200
const CAMERA_FRAME_TIMEOUT_MS = 10000
const MODEL_TARGET_ROTATION_X = Math.PI / 2
const MODEL_TARGET_SIZE = 0.78

const createIdleNarrationState = () => ({ status: 'idle', message: null })

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

const createCameraPlaybackError = (cause = null) => {
  const error = new Error('Camera stream did not produce a playable video frame.')
  error.name = 'CameraPlaybackError'
  error.code = 'camera-playback-failed'
  error.cause = cause
  return error
}

const waitForCameraVideoPlayback = (video, signal) => new Promise((resolve, reject) => {
  if (!video) {
    reject(createCameraPlaybackError())
    return
  }

  let settled = false
  let playbackTimer = null
  let videoFrameCallbackId = null
  let videoTrack = null

  const cleanup = () => {
    if (playbackTimer) window.clearTimeout(playbackTimer)
    if (videoFrameCallbackId !== null && typeof video.cancelVideoFrameCallback === 'function') {
      video.cancelVideoFrameCallback(videoFrameCallbackId)
    }
    video.removeEventListener('loadedmetadata', beginPlayback)
    video.removeEventListener('playing', confirmVideoFrame)
    video.removeEventListener('canplay', confirmVideoFrame)
    videoTrack?.removeEventListener('unmute', confirmVideoFrame)
    videoTrack?.removeEventListener('ended', handleTrackEnded)
    signal?.removeEventListener('abort', handleAbort)
  }

  const finish = (callback, value) => {
    if (settled) return
    settled = true
    cleanup()
    callback(value)
  }

  const fail = (cause = null) => finish(reject, createCameraPlaybackError(cause))

  function handleTrackEnded() {
    fail()
  }

  function handleAbort() {
    fail()
  }

  function confirmVideoFrame() {
    if (settled) return

    videoTrack = video.srcObject?.getVideoTracks?.()[0] || null
    if (!videoTrack || videoTrack.readyState !== 'live') {
      fail()
      return
    }
    if (videoTrack.muted || video.paused || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return

    if (typeof video.requestVideoFrameCallback === 'function') {
      if (videoFrameCallbackId !== null) return
      videoFrameCallbackId = video.requestVideoFrameCallback(() => finish(resolve))
      return
    }

    finish(resolve)
  }

  function beginPlayback() {
    if (settled || playbackTimer) return

    videoTrack = video.srcObject?.getVideoTracks?.()[0] || null
    if (!videoTrack || videoTrack.readyState !== 'live') {
      fail()
      return
    }

    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.setAttribute('autoplay', '')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')

    videoTrack.addEventListener('unmute', confirmVideoFrame)
    videoTrack.addEventListener('ended', handleTrackEnded, { once: true })
    playbackTimer = window.setTimeout(() => fail(), CAMERA_FRAME_TIMEOUT_MS)

    let playPromise
    try {
      playPromise = video.play()
    } catch (playbackError) {
      fail(playbackError)
      return
    }

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(confirmVideoFrame).catch(fail)
    }
    confirmVideoFrame()
  }

  video.addEventListener('loadedmetadata', beginPlayback)
  video.addEventListener('playing', confirmVideoFrame)
  video.addEventListener('canplay', confirmVideoFrame)
  signal?.addEventListener('abort', handleAbort, { once: true })

  if (signal?.aborted) handleAbort()
  else if (video.readyState >= 1) beginPlayback()
})

const getARSessionError = async (error) => {
  if (error?.code === 'camera-playback-failed') {
    return {
      code: 'camera-playback-failed',
      message: 'Camera đã được cấp quyền nhưng chưa phát được hình ảnh. Hãy thử mở lại camera.',
    }
  }

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
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error('Mô hình không có kích thước hợp lệ.')
  }

  model.scale.multiplyScalar((MODEL_TARGET_SIZE / maxDimension) * (config.scale || 1))
  model.updateMatrixWorld(true)

  const normalizedBox = new THREE.Box3().setFromObject(model)
  const center = normalizedBox.getCenter(new THREE.Vector3())
  model.position.set(-center.x, -normalizedBox.min.y, -center.z)
}

const loadModelOntoAnchor = (loader, anchorGroup, model) => new Promise((resolve, reject) => {
  loader.load(
    model.url,
    (gltf) => {
      try {
        normalizeModelForTarget(gltf.scene, model)

        const targetOrientedRoot = new THREE.Group()
        const position = model.position || {}
        targetOrientedRoot.position.set(position.x || 0, position.y || 0, position.z || 0)
        // MindAR targets lie on XY while glTF models are Y-up. Rotating the
        // normalized model makes it stand out from the physical card surface.
        targetOrientedRoot.rotation.x = MODEL_TARGET_ROTATION_X
        targetOrientedRoot.add(gltf.scene)
        anchorGroup.add(targetOrientedRoot)

        let mixer = null
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(gltf.scene)
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
        }

        resolve({
          mixer,
          cleanup: () => {
            mixer?.stopAllAction()
            anchorGroup.remove(targetOrientedRoot)
            disposeObject3D(gltf.scene)
          },
        })
      } catch (modelError) {
        disposeObject3D(gltf.scene)
        reject(modelError)
      }
    },
    undefined,
    reject,
  )
})

export default function useMindARSession(experiences = HERITAGE_EXPERIENCES) {
  const containerRef = useRef(null)
  const mindARRef = useRef(null)
  const cameraPlaybackAbortRef = useRef(null)
  const sessionIdRef = useRef(0)
  const mountedRef = useRef(true)
  const recognizedTargetRef = useRef(null)
  const targetLostTimerRef = useRef(null)
  const audioByTargetRef = useRef(new Map())
  const audioRef = useRef(null)
  const narrationTargetRef = useRef(null)
  const narrationManuallyPausedRef = useRef(false)
  const anchorModelCleanupsRef = useRef(new Map())
  const mixersRef = useRef([])
  const dracoLoaderRef = useRef(null)
  const [status, setStatus] = useState(getSupportStatus)
  const [error, setError] = useState(null)
  const [recognizedExperience, setRecognizedExperience] = useState(null)
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
    cameraPlaybackAbortRef.current?.abort()
    cameraPlaybackAbortRef.current = null
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

    anchorModelCleanupsRef.current.forEach((cleanup) => cleanup?.())
    anchorModelCleanupsRef.current.clear()
    mixersRef.current = []
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
    setNarrationState(createIdleNarrationState())
    setStatus(getSupportStatus())
  }, [releaseSession])

  const pauseAR = useCallback(() => {
    const mindAR = mindARRef.current
    if (!mindAR?.controller) return

    if (targetLostTimerRef.current) {
      window.clearTimeout(targetLostTimerRef.current)
      targetLostTimerRef.current = null
    }

    try {
      // Keep the camera stream alive so iOS can resume without another
      // permission/play transition, while stopping MindAR frame processing.
      mindAR.pause(true)
    } catch (pauseError) {
      console.warn('Không thể tạm dừng phiên nhận diện AR.', pauseError)
    }
  }, [])

  const resumeAR = useCallback(() => {
    const mindAR = mindARRef.current
    if (!mindAR?.controller) return

    try {
      mindAR.unpause()
    } catch (resumeError) {
      console.warn('Không thể tiếp tục phiên nhận diện AR.', resumeError)
    }
  }, [])

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
    setNarrationState(createIdleNarrationState())
    setStatus('loading')

    // Prepare audio elements without downloading all narration files while the
    // target bundle and camera are starting on a mobile connection.
    experiences.forEach((experience) => {
      if (!experience.audioUrl) return

      const audio = new Audio(experience.audioUrl)
      audio.preload = 'none'

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
    })

    try {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js')
      if (!mountedRef.current || sessionId !== sessionIdRef.current || !containerRef.current) return

      const mindAR = new MindARThree({
        container: containerRef.current,
        // Vite fingerprints this asset and Vercel serves /assets as immutable,
        // so the browser HTTP cache is sufficient. Avoid blocking camera access
        // on an extra Cache Storage write and Blob round-trip on iOS.
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
      const modelLoadPromises = new Map()

      const loadModelForTarget = (experience, anchor) => {
        if (
          !experience.model?.url
          || anchorModelCleanupsRef.current.has(experience.targetIndex)
          || modelLoadPromises.has(experience.targetIndex)
        ) return

        const loadPromise = loadModelOntoAnchor(loader, anchor.group, experience.model)
          .then(({ cleanup, mixer }) => {
            if (!mountedRef.current || sessionId !== sessionIdRef.current) {
              cleanup()
              return
            }

            anchorModelCleanupsRef.current.set(experience.targetIndex, cleanup)
            if (mixer) mixersRef.current.push(mixer)
          })
          .catch((modelError) => {
            modelLoadPromises.delete(experience.targetIndex)
            if (!mountedRef.current || sessionId !== sessionIdRef.current) return
            console.error(`Không thể tải mô hình AR cho ${experience.name}.`, modelError)
          })

        modelLoadPromises.set(experience.targetIndex, loadPromise)
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
            if (audioRef.current?.preload === 'none') {
              audioRef.current.preload = 'auto'
              audioRef.current.load()
            }
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
            setNarrationState({ status: 'paused', message: 'Thuyết minh đã tạm dừng khi mất thẻ.' })
            setStatus('scanning')
          }, TARGET_LOST_GRACE_MS)
        }
      })

      // MindAR 1.2 resolves video setup on loadedmetadata. On iOS that does not
      // guarantee that autoplay started or that a camera frame was rendered.
      // Start both checks together and do not advertise scanning until both pass.
      const cameraPlaybackController = new AbortController()
      cameraPlaybackAbortRef.current = cameraPlaybackController
      const mindARStartPromise = mindAR.start()
      await Promise.all([
        mindARStartPromise,
        waitForCameraVideoPlayback(mindAR.video, cameraPlaybackController.signal),
      ])
      if (cameraPlaybackAbortRef.current === cameraPlaybackController) {
        cameraPlaybackAbortRef.current = null
      }
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
    narrationState,
    pauseAR,
    recognizedExperience,
    resumeAR,
    startAR,
    status,
    stopAR,
    toggleNarration,
  }
}

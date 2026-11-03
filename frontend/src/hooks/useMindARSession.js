import { useCallback, useEffect, useRef, useState } from 'react'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'
import { prefetchMindARTarget, prepareMindARTargetSource } from '../services/mindARTargetCache.js'

const TARGET_LOST_GRACE_MS = 1200

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
  const audioByTargetRef = useRef(new Map())
  const audioRef = useRef(null)
  const narrationTargetRef = useRef(null)
  const narrationManuallyPausedRef = useRef(false)
  const releaseTargetSourceRef = useRef(null)
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
    recognizedTargetRef.current = null
    narrationTargetRef.current = null
    narrationManuallyPausedRef.current = false
    releaseTargetSourceRef.current?.()
    releaseTargetSourceRef.current = null

    if (targetLostTimerRef.current) {
      window.clearTimeout(targetLostTimerRef.current)
      targetLostTimerRef.current = null
    }

    audioRef.current = null
    audioByTargetRef.current.forEach(releaseAudio)
    audioByTargetRef.current.clear()

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
      const [{ MindARThree }, targetSource] = await Promise.all([
        import('mind-ar/dist/mindar-image-three.prod.js'),
        prepareMindARTargetSource(targetBundleUrl),
      ])
      if (!mountedRef.current || sessionId !== sessionIdRef.current || !containerRef.current) {
        targetSource.release()
        return
      }

      releaseTargetSourceRef.current = targetSource.release

      const mindAR = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: targetSource.url,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        warmupTolerance: 5,
        missTolerance: 12,
      })
      mindARRef.current = mindAR

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

      await mindAR.start()
      releaseTargetSourceRef.current?.()
      releaseTargetSourceRef.current = null
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return
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
    prefetchMindARTarget(targetBundleUrl).catch((prefetchError) => {
      console.warn('Không thể tải sẵn bộ nhận diện MindAR.', prefetchError)
    })
  }, [])

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

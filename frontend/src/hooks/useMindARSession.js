import { useCallback, useEffect, useRef, useState } from 'react'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'

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
  const [status, setStatus] = useState(getSupportStatus)
  const [error, setError] = useState(null)
  const [recognizedExperience, setRecognizedExperience] = useState(null)

  const releaseSession = useCallback(() => {
    sessionIdRef.current += 1
    recognizedTargetRef.current = null

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
    setStatus('loading')

    try {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js')
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

      experiences.forEach((experience) => {
        const anchor = mindAR.addAnchor(experience.targetIndex)
        anchor.onTargetFound = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current || recognizedTargetRef.current !== null) return

          recognizedTargetRef.current = experience.targetIndex
          setRecognizedExperience(experience)
          setStatus('recognized')

          window.setTimeout(() => {
            if (!mountedRef.current || sessionId !== sessionIdRef.current) return
            releaseSession()
            setStatus('viewing')
          }, 120)
        }
      })

      await mindAR.start()
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return

      mindAR.renderer.setAnimationLoop(() => {
        mindAR.renderer.render(mindAR.scene, mindAR.camera)
      })
      setStatus('scanning')
    } catch (sessionError) {
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return
      releaseSession()
      setError(await getARSessionError(sessionError))
      setStatus('error')
    }
  }, [experiences, releaseSession])

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
    recognizedExperience,
    startAR,
    status,
    stopAR,
  }
}

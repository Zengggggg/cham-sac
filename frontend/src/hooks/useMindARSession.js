import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import targetBundleUrl from '../assets/ar-targets/heritage-targets.mind?url'
import { HERITAGE_EXPERIENCES } from '../data/heritageExperiences.js'

const createIdleModelState = () => ({ status: 'idle', progress: null, message: null })

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

const normalizeModelForScreen = (model, config = {}) => {
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
  const modelRootsRef = useRef([])
  const screenLockedModelsRef = useRef([])
  const mixersRef = useRef([])
  const dracoLoaderRef = useRef(null)
  const [status, setStatus] = useState(getSupportStatus)
  const [error, setError] = useState(null)
  const [recognizedExperience, setRecognizedExperience] = useState(null)
  const [modelState, setModelState] = useState(createIdleModelState)

  const releaseSession = useCallback(() => {
    sessionIdRef.current += 1
    recognizedTargetRef.current = null

    mixersRef.current.forEach((mixer) => mixer.stopAllAction())
    mixersRef.current = []
    modelRootsRef.current.forEach(disposeObject3D)
    modelRootsRef.current = []
    screenLockedModelsRef.current = []
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
    setStatus('loading')

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
        missTolerance: 5,
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

      experiences.forEach((experience) => {
        const anchor = mindAR.addAnchor(experience.targetIndex)
        anchor.onTargetFound = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return

          recognizedTargetRef.current = experience.targetIndex
          setRecognizedExperience(experience)
          setModelState(experience.model?.url
            ? modelStates.get(experience.targetIndex) || { status: 'loading', progress: null, message: null }
            : { status: 'unavailable', progress: null, message: 'Địa danh này chưa có mô hình 3D.' })
          setStatus('recognized')
        }

        anchor.onTargetLost = () => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current || recognizedTargetRef.current !== experience.targetIndex) return

          recognizedTargetRef.current = null
          setRecognizedExperience(null)
          setModelState(createIdleModelState())
          setStatus('scanning')
        }


        if (!experience.model?.url) return

        const updateModelState = (nextState) => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) return
          modelStates.set(experience.targetIndex, nextState)
          if (recognizedTargetRef.current === experience.targetIndex) setModelState(nextState)
        }

        updateModelState({ status: 'loading', progress: null, message: null })
        loader.load(
          experience.model.url,
          (gltf) => {
            if (!mountedRef.current || sessionId !== sessionIdRef.current) {
              disposeObject3D(gltf.scene)
              return
            }

            try {
              normalizeModelForScreen(gltf.scene, experience.model)

              const screenLockedRoot = new THREE.Group()
              const position = experience.model.position || {}
              screenLockedRoot.position.set(position.x || 0, position.y || 0, position.z || 0)
              screenLockedRoot.add(gltf.scene)
              anchor.group.add(screenLockedRoot)

              modelRootsRef.current.push(gltf.scene)
              screenLockedModelsRef.current.push({ anchorGroup: anchor.group, root: screenLockedRoot })

              if (gltf.animations?.length) {
                const mixer = new THREE.AnimationMixer(gltf.scene)
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
                mixersRef.current.push(mixer)
              }

              updateModelState({ status: 'ready', progress: 100, message: null })
            } catch (modelError) {
              console.error('Không thể chuẩn hóa mô hình AR', modelError)
              disposeObject3D(gltf.scene)
              updateModelState({ status: 'error', progress: null, message: 'Mô hình 3D không có dữ liệu hiển thị hợp lệ.' })
            }
          },
          (event) => {
            const progress = event.total > 0 ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : null
            updateModelState({ status: 'loading', progress, message: null })
          },
          (loadError) => {
            console.error('Không thể tải mô hình AR', loadError)
            updateModelState({ status: 'error', progress: null, message: 'Không tải được mô hình 3D. Hãy kiểm tra kết nối rồi thử lại.' })
          },
        )
      })

      await mindAR.start()
      if (!mountedRef.current || sessionId !== sessionIdRef.current) return

      const clock = new THREE.Clock()
      const anchorWorldQuaternion = new THREE.Quaternion()
      const cameraWorldQuaternion = new THREE.Quaternion()
      mindAR.renderer.setAnimationLoop(() => {
        const delta = clock.getDelta()
        mixersRef.current.forEach((mixer) => mixer.update(delta))

        mindAR.scene.updateMatrixWorld(true)
        mindAR.camera.getWorldQuaternion(cameraWorldQuaternion)
        screenLockedModelsRef.current.forEach(({ anchorGroup, root }) => {
          anchorGroup.getWorldQuaternion(anchorWorldQuaternion)
          root.quaternion.copy(anchorWorldQuaternion).invert().multiply(cameraWorldQuaternion)
        })

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
    modelState,
    recognizedExperience,
    startAR,
    status,
    stopAR,
  }
}

const TARGET_CACHE_NAME = 'mindar-targets-v1'

const pendingCacheWrites = new Map()

const supportsTargetCache = () => (
  typeof window !== 'undefined'
  && window.isSecureContext
  && 'caches' in window
  && typeof URL !== 'undefined'
  && typeof URL.createObjectURL === 'function'
)

const removeOutdatedTargets = async (cache, currentUrl) => {
  const currentAbsoluteUrl = new URL(currentUrl, window.location.href).href
  const cachedRequests = await cache.keys()

  await Promise.all(
    cachedRequests
      .filter((request) => request.url !== currentAbsoluteUrl)
      .map((request) => cache.delete(request)),
  )
}

const cacheTargetBundle = async (targetUrl) => {
  if (!supportsTargetCache()) return false

  const cache = await window.caches.open(TARGET_CACHE_NAME)
  const cachedResponse = await cache.match(targetUrl)
  if (cachedResponse) return true

  const response = await fetch(targetUrl)
  if (!response.ok) {
    throw new Error(`Không tải được bộ nhận diện MindAR (${response.status}).`)
  }

  try {
    await cache.put(targetUrl, response.clone())
    await removeOutdatedTargets(cache, targetUrl)
    return true
  } catch (cacheError) {
    // HTTP caching still provides a fallback when Cache Storage is unavailable,
    // full, or disabled by an embedded browser.
    console.warn('Không thể lưu bộ nhận diện MindAR vào Cache Storage.', cacheError)
    return false
  }
}

const ensureTargetBundleCached = (targetUrl) => {
  if (!pendingCacheWrites.has(targetUrl)) {
    const cacheWrite = cacheTargetBundle(targetUrl)
      .finally(() => pendingCacheWrites.delete(targetUrl))
    pendingCacheWrites.set(targetUrl, cacheWrite)
  }

  return pendingCacheWrites.get(targetUrl)
}

export const prefetchMindARTarget = async (targetUrl) => {
  await ensureTargetBundleCached(targetUrl)
}

export const prepareMindARTargetSource = async (targetUrl) => {
  try {
    const isCached = await ensureTargetBundleCached(targetUrl)
    if (!isCached) return { url: targetUrl, release: () => {} }

    const cache = await window.caches.open(TARGET_CACHE_NAME)
    const response = await cache.match(targetUrl)
    if (!response) return { url: targetUrl, release: () => {} }

    const objectUrl = URL.createObjectURL(await response.blob())
    let released = false

    return {
      url: objectUrl,
      release: () => {
        if (released) return
        released = true
        URL.revokeObjectURL(objectUrl)
      },
    }
  } catch (cacheError) {
    console.warn('Không thể đọc bộ nhận diện MindAR từ Cache Storage.', cacheError)
    return { url: targetUrl, release: () => {} }
  }
}

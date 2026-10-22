import { useEffect, useState } from 'react'
import {
  HERITAGE_EXPERIENCES,
  mergeHeritageExperiences,
} from '../data/heritageExperiences.js'
import { fetchArExperiences } from '../services/arExperienceService.js'

export default function useArExperiences() {
  const [experiences, setExperiences] = useState(HERITAGE_EXPERIENCES)
  const [source, setSource] = useState('fallback')

  useEffect(() => {
    const controller = new AbortController()

    fetchArExperiences({ signal: controller.signal })
      .then((remoteExperiences) => {
        if (controller.signal.aborted) return
        setExperiences(mergeHeritageExperiences(remoteExperiences))
        setSource(remoteExperiences.length > 0 ? 'backend' : 'fallback')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setExperiences(HERITAGE_EXPERIENCES)
        setSource('fallback')
      })

    return () => controller.abort()
  }, [])

  return { experiences, source }
}

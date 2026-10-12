import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useBack(fallback = '/feed') {
  const navigate = useNavigate()
  const { key } = useLocation()
  return useCallback(() => {
    if (key !== 'default') navigate(-1)
    else navigate(fallback)
  }, [key, navigate, fallback])
}

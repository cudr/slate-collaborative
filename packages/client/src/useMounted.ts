import { useRef, useEffect } from 'react'

function useMounted({ onMount = () => {}, onUnmount = () => {} } = {}) {
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    onMount()
    return () => {
      isMounted.current = false
      onUnmount()
    }
  }, [])

  return isMounted
}

export default useMounted

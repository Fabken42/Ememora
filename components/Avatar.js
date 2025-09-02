'use client'

import { useState, useEffect } from 'react'
import { getDefaultAvatar } from '@/lib/utils'

export default function Avatar({ 
  src, 
  alt = "Avatar", 
  size = 32,
  className = "",
  onClick
}) {
  const [imgSrc, setImgSrc] = useState(src || getDefaultAvatar())
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (src) {
      setImgSrc(src)
      setHasError(false)
    } else {
      setImgSrc(getDefaultAvatar())
    }
  }, [src])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(getDefaultAvatar())
    }
  }

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  )
}
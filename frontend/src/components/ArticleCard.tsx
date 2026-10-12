import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Img } from './ui'

export function ArticleCard({ to, image, imageClass = '', className = '', children }: {
  to: string
  image?: string | null
  imageClass?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={className}>
      {image && <Img src={image} className={imageClass} />}
      {children}
    </Link>
  )
}

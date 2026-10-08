import { getAvatarById } from '../lib/avatars'

interface AvatarBadgeProps {
  avatar?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showLabel?: boolean
}

export function AvatarBadge({
  avatar,
  size = 'md',
  className = '',
  showLabel = false
}: AvatarBadgeProps) {
  const persona = getAvatarById(avatar)

  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  }

  return (
    <div className={`avatar-badge-wrap ${className}`}>
      <span
        className={`avatar-badge-icon ${sizeClasses[size]}`}
        style={{
          background: persona.gradient,
          boxShadow: `0 3px 0 rgba(0,0,0,0.35), 0 0 12px ${persona.border}40`,
          borderColor: persona.border
        }}
        title={persona.name}
        aria-label={persona.name}
      >
        <span className="avatar-emoji">{persona.emoji}</span>
      </span>
      {showLabel ? <span className="avatar-label">{persona.name}</span> : null}
    </div>
  )
}

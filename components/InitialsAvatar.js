'use client';

import { getInitials, getAvatarColor } from '../lib/personnel';

/**
 * Avatar berbasis inisial nama (pengganti foto profil).
 * Contoh: "Ramiro Gunady" -> "RG"
 */
export default function InitialsAvatar({ name, size = 40, muted = false, className = '' }) {
    const hasName = Boolean(name && name.trim());
    const initials = hasName ? getInitials(name) : '—';
    const background = hasName ? getAvatarColor(name) : '#E5E7EB';

    return (
        <div
            role="img"
            aria-label={hasName ? name : 'Belum ada personel'}
            className={`initials-avatar ${muted ? 'initials-avatar--muted' : ''} ${className}`}
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.38),
                background,
                color: hasName ? '#fff' : '#6B7280',
            }}
        >
            {initials}
        </div>
    );
}

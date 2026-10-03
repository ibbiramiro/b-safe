// ============================================================
// Personnel helpers: initials avatar, color, WhatsApp link
// ============================================================

/**
 * Ambil inisial dari nama.
 *  "Ramiro Gunady"       -> "RG"
 *  "Ahmad Budi Santoso"  -> "AS" (huruf pertama kata pertama + kata terakhir)
 *  "Ramiro"              -> "R"
 *  "Ahmad S."            -> "AS"
 */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';

    // Ambil huruf pertama (unicode-aware) dari tiap kata, abaikan tanda baca
    const letters = name
        .trim()
        .split(/\s+/)
        .map(word => word.match(/\p{L}/u)?.[0])
        .filter(Boolean);

    if (letters.length === 0) return '?';
    if (letters.length === 1) return letters[0].toUpperCase();

    return (letters[0] + letters[letters.length - 1]).toUpperCase();
}

// Palet warna dengan kontras teks putih yang cukup (WCAG AA untuk teks bold)
const AVATAR_COLORS = [
    '#2563EB', // blue
    '#7C3AED', // violet
    '#DB2777', // pink
    '#DC2626', // red
    '#C2410C', // orange
    '#047857', // emerald
    '#0F766E', // teal
    '#4338CA', // indigo
    '#374151', // gray
];

/**
 * Warna deterministik berdasarkan nama, supaya orang yang sama
 * selalu mendapat warna yang sama di semua halaman.
 */
export function getAvatarColor(name) {
    if (!name) return '#9CA3AF';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Normalisasi nomor telepon ke format internasional untuk wa.me
 * (tanpa "+", spasi, atau tanda hubung). Default kode negara Indonesia (62).
 *  "089601156741"       -> "6289601156741"
 *  "+62 812-3456-7890"  -> "6281234567890"
 *  "812 3456 7890"      -> "6281234567890"
 * Return null jika nomor tidak valid.
 */
export function toWhatsAppNumber(phone, defaultCountryCode = '62') {
    if (!phone) return null;

    let digits = String(phone).replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('00')) {
        // Format internasional "0062..." -> "62..."
        digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
        // Format lokal "08..." -> "628..."
        digits = defaultCountryCode + digits.slice(1);
    } else if (digits.startsWith('8') && !String(phone).trim().startsWith('+')) {
        // Tanpa awalan "812..." -> "62812..."
        digits = defaultCountryCode + digits;
    }

    // E.164: maksimal 15 digit; nomor Indonesia minimal ~10 digit
    if (digits.length < 10 || digits.length > 15) return null;

    return digits;
}

export function getWhatsAppLink(phone) {
    const number = toWhatsAppNumber(phone);
    return number ? `https://wa.me/${number}` : null;
}

/**
 * Validasi sederhana input telepon: hanya angka, spasi, +, -, (, )
 * dan menghasilkan nomor WhatsApp yang valid.
 */
export function isValidPhone(phone) {
    if (!phone || !/^[\d\s+\-()]+$/.test(phone.trim())) return false;
    return toWhatsAppNumber(phone) !== null;
}

export const PERSONNEL_STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'sweeping', label: 'Sweeping' },
    { value: 'assistance_req', label: 'Assistance Req.' },
    { value: 'off_duty', label: 'Off Duty' },
];

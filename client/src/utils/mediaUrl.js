const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const toRelativeUploadPath = (value = '') => {
    if (!value) return '';

    const normalized = String(value).trim().replace(/\\/g, '/');
    if (!normalized) return '';

    if (/^https?:\/\//i.test(normalized)) {
        try {
            const parsed = new URL(normalized);
            const pathName = parsed.pathname || '';
            const uploadIndex = pathName.indexOf('/uploads/');
            if (uploadIndex >= 0) {
                return pathName.slice(uploadIndex);
            }
            return normalized;
        } catch {
            return normalized;
        }
    }

    const uploadIndex = normalized.indexOf('/uploads/');
    if (uploadIndex >= 0) {
        return normalized.slice(uploadIndex);
    }

    const plainUploadIndex = normalized.indexOf('uploads/');
    if (plainUploadIndex >= 0) {
        return `/${normalized.slice(plainUploadIndex)}`;
    }

    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

export const getMediaUrlWithFallback = (url = '') => {
    const relativePath = toRelativeUploadPath(url);
    if (!relativePath) return { primary: '', fallback: '' };

    if (/^https?:\/\//i.test(relativePath)) {
        return { primary: relativePath, fallback: relativePath };
    }

    const primary = `${API_ORIGIN}${relativePath}`;

    if (relativePath.includes('/uploads/accommodations/')) {
        return {
            primary,
            fallback: `${API_ORIGIN}${relativePath.replace('/uploads/accommodations/', '/uploads/')}`,
        };
    }

    if (relativePath.includes('/uploads/videos/')) {
        return {
            primary,
            fallback: `${API_ORIGIN}${relativePath.replace('/uploads/videos/', '/uploads/')}`,
        };
    }

    if (relativePath.startsWith('/uploads/')) {
        const fileName = relativePath.replace('/uploads/', '');

        if (fileName.startsWith('photos-')) {
            return {
                primary,
                fallback: `${API_ORIGIN}/uploads/accommodations/${fileName}`,
            };
        }

        if (fileName.startsWith('videos-')) {
            return {
                primary,
                fallback: `${API_ORIGIN}/uploads/videos/${fileName}`,
            };
        }
    }

    return { primary, fallback: primary };
};

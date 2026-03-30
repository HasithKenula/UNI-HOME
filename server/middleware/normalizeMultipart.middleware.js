const parsePathSegments = (key) => {
    const segments = [];
    const matcher = /[^.[\]]+/g;
    let match = matcher.exec(key);

    while (match) {
        segments.push(match[0]);
        match = matcher.exec(key);
    }

    return segments;
};

const setDeepValue = (target, path, value) => {
    let cursor = target;

    for (let i = 0; i < path.length; i += 1) {
        const segment = path[i];
        const isLast = i === path.length - 1;

        if (isLast) {
            cursor[segment] = value;
            return;
        }

        if (!cursor[segment] || typeof cursor[segment] !== 'object') {
            cursor[segment] = {};
        }

        cursor = cursor[segment];
    }
};

const normalizeMultipartBody = (req, _res, next) => {
    if (!req.is('multipart/form-data') || !req.body || typeof req.body !== 'object') {
        next();
        return;
    }

    const normalized = {};

    Object.entries(req.body).forEach(([key, value]) => {
        if (!key.includes('[')) {
            normalized[key] = value;
            return;
        }

        const path = parsePathSegments(key);
        if (!path.length) return;
        setDeepValue(normalized, path, value);
    });

    req.body = normalized;
    next();
};

export default normalizeMultipartBody;

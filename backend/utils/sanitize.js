// backend/utils/sanitize.js
// Module de sanitization XSS renforcé

const xss = require('xss');

const xssOptions = {
    whiteList: {
        b: [],
        i: [],
        u: [],
        strong: [],
        em: [],
        br: [],
        p: [],
    },

    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'noscript'],

    onTagAttr: function (tag, name, value, isWhiteAttr) {
        const dangerousAttributes = [
            'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
            'onmouseenter', 'onmouseleave', 'onmousedown', 'onmouseup',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
            'onkeydown', 'onkeyup', 'onkeypress',
            'ondrag', 'ondragstart', 'ondragend', 'ondrop',
            'onscroll', 'onresize', 'onunload', 'onbeforeunload',
            'onanimationstart', 'onanimationend', 'ontransitionend',
            'oncontextmenu', 'oninput', 'oninvalid', 'onsearch',
            'ontoggle', 'onwheel', 'oncopy', 'oncut', 'onpaste',
            'onabort', 'oncanplay', 'ondurationchange', 'onemptied',
            'onended', 'onloadeddata', 'onloadedmetadata', 'onloadstart',
            'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
            'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate',
            'onvolumechange', 'onwaiting', 'onpointerdown', 'onpointerup',
            'onpointermove', 'onpointerenter', 'onpointerleave', 'onpointercancel',
            'ongotpointercapture', 'onlostpointercapture', 'onshow', 'onautocomplete',
            'onautocompleteerror', 'onmessage', 'onopen', 'onsort', 'onafterprint',
            'onbeforeprint', 'onhashchange', 'onoffline', 'ononline', 'onpagehide',
            'onpageshow', 'onpopstate', 'onstorage', 'formaction'
        ];

        const attrName = name.toLowerCase();

        if (attrName.startsWith('on')) {
            return '';
        }

        if (dangerousAttributes.includes(attrName)) {
            return '';
        }

        if ((attrName === 'href' || attrName === 'src' || attrName === 'action') && value) {
            const valueLower = value.toLowerCase().trim();
            if (
                valueLower.startsWith('javascript:') ||
                valueLower.startsWith('data:') ||
                valueLower.startsWith('vbscript:')
            ) {
                return '';
            }
        }
    },

    onIgnoreTag: function (tag, html, options) {
        const dangerousTags = [
            'script', 'svg', 'iframe', 'object', 'embed', 'applet',
            'form', 'input', 'button', 'select', 'textarea',
            'link', 'meta', 'base', 'frame', 'frameset',
            'math', 'video', 'audio', 'source', 'track',
            'canvas', 'noscript', 'template', 'slot', 'portal'
        ];

        const tagLower = tag.toLowerCase();

        if (dangerousTags.includes(tagLower)) {
            return '';
        }

        return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};

function sanitize(input) {
    if (typeof input !== 'string') {
        return input;
    }

    let cleaned = xss(input, xssOptions);

    cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');
    cleaned = cleaned.replace(/javascript\s*:/gi, '');
    cleaned = cleaned.replace(/data\s*:/gi, '');
    cleaned = cleaned.replace(/vbscript\s*:/gi, '');
    cleaned = cleaned.replace(/expression\s*\(/gi, '');
    cleaned = cleaned.replace(/url\s*\(\s*["']?\s*javascript/gi, '');

    return cleaned;
}

function sanitizeObject(obj, fields) {
    const result = { ...obj };

    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = sanitize(result[field]);
        }
    }

    return result;
}

module.exports = {
    sanitize,
    sanitizeObject,
    xssOptions
};

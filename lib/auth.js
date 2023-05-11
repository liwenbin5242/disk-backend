const { decodeJwt } = require('./utils');
const { pathToRegexp } = require('path-to-regexp');
const url = require('url');
const whiteListUrls = [
    '/api/user/regcode',
    '/api/user/login',
    '/api/user/register',
    '/api/cors/(.*)',
    '/api/cors_v2/(.*)',
    '/oauth_redirect',
    '/apidoc/(.*)',
    '/watermark/(.*)',
    '/imgs/(.*)',
    '/qrcode/(.*)',
    '/upload/(.*)',
    '/api/member/m3u8',
];
function isWhiteListUrls(req) {
    const path = url.parse(req.url).pathname;
    for (let url of whiteListUrls) {
        if (pathToRegexp(url).exec(path)) {
            return true;
        }
    }
}
async function tokenAuth(req, res, next) {
    try {
        req.headers.authorization =
            req.headers.authorization ||
            'Bearer ' + (req.headers['disk-token'] || req.query.token);
        if (req.headers.authorization && !isWhiteListUrls(req)) {
            const result = await decodeJwt(req.headers.authorization.slice(7));
            req.user = result.user;
            return next();
        } else if (isWhiteListUrls(req)) {
            return next();
        }
        return res.json({ code: 1000, message: '非法用户', data: {} });
    } catch (err) {
        return res.json({ code: 1000, message: '非法用户', data: {} });
    }
}
module.exports = {
    tokenAuth,
};

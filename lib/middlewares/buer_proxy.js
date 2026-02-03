const proxy = require('express-http-proxy'); 
const { logger } = require('../../utils/logger');

class Proxy {
    constructor() {
        this.proxy = proxy;
    }
    proxyServer() {
        return this.proxy('buerchen.top', {
            proxyReqPathResolver: async (req) => {
                logger.info(`执行代理请求`)
                return req.originalUrl.replace(req.baseUrl ,'');
            },
            proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
                proxyReqOpts.headers['referer'] = 'https://buerchen.top';
                return proxyReqOpts;
            }
        });
    }
}
module.exports = new Proxy();
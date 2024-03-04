const proxy = require('express-http-proxy'); 
const { genBDToken } = require('../../utils/bdproxy');
const { logger } = require('../../utils/logger');

class Proxy {
    constructor() {
        this.proxy = proxy;
    }
    do() {
        return this.proxy('pan.baidu.com', {
            proxyReqPathResolver: async (req) => {
                const uri = await genBDToken(req);
                logger.info(`执行代理请求：${uri}`)
                return uri;
            },
        });
    }
}
module.exports = new Proxy();
const axios = require('axios');
const {logger} = require('../utils/logger');
const config = require('config');

async function serverAuth() {
    try {
        const data = await axios.get(`${config.get('AuthServer')}/api/agent/verify?machid=${global.machid}`);
        if (data.data.code === 0 && data.data.data.auth ) {
            global.auth = {auth: data.data.data.auth, expires: data.data.data.expires};
            logger.info('auth success')
        } else {
            logger.info('auth error');
            global.auth = {
                auth: false,
                message: '未授权'
            };
        }
    } catch (error) {
        logger.error(error);
    }
}

module.exports = {
    serverAuth
}

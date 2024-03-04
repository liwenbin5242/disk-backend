const axios = require('axios');
const {logger} = require('../utils/logger');
const config = require('config');
const rediser = require('../utils/rediser');
const {machineId} = require('node-machine-id');
async function serverAuth() {
    try {
        const machid = await machineId();
        const data = await axios.get(`${config.get('AuthServer')}/api/agent/verify?machid=${machid}`);
        if (data?.data?.code === 0 && data?.data?.data?.auth ) {
            await rediser.set('machid', machid);
            logger.info('auth success')
        } else {
            logger.info('auth error');
            await rediser.del('machid');
        }
    } catch (error) {
        logger.error(error);
    }
}

module.exports = {
    serverAuth
}

const cron = require('node-cron');
const { ObjectId } = require('mongodb');
const mongodber = require('../utils/mongodber');
const { logger } = require('../utils/logger');
const utils = require('../lib/utils');
const pool = require('../utils/mysql')

module.exports = function jobs() {
    logger.info('crons Jobs start ')

    cron.schedule('30 10 */30 * * *', async ()=> {
        logger.info(`check bd token`)
    })
    
    cron.schedule('*/10 * * * * *', async ()=> {
        const res = await pool.query('SELECT 1;')
        logger.info(`check mysql status end`)
    })
}

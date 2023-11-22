const cron = require('node-cron');
const mongodber = require('../utils/mongodber');
const { logger } = require('../utils/logger');
const utils = require('../lib/utils');
const pool = require('../utils/mysql')
const diskDB = mongodber.use('disk');

module.exports = function jobs() {
    logger.info('crons Jobs start ')
    cron.schedule('*/10 * * * * *', async () => {
        logger.info(`check bd token`)
        const disks = await diskDB.collection('disks').find().toArray()
        for(let disk of disks) {
            const refresh_token = await utils.bdapis.refreshToken(disk.refresh_token)
            await diskDB.colletion('disks').updateOne({_id: disk._id}, {$set:{refresh_token:refresh_token.data.refresh_token, access_token:refresh_token.data.access_token, }})
        }
    })
    
    cron.schedule('*/10 * * * * *', async ()=> {
        const res = await pool.query('SELECT 1;')
        logger.info(`check mysql status end`)
    })
}

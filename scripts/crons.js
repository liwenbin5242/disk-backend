const cron = require('node-cron');
const mongodber = require('../utils/mongodber');
const { logger } = require('../utils/logger');
const utils = require('../lib/utils');
const pool = require('../utils/mysql')
const diskDB = mongodber.use('disk');
const {task} = require('./robot')
module.exports = function jobs() {
    logger.info('crons Jobs start ')
    cron.schedule('0 0 0 */1 * *', async () => {
        logger.info(`check bd token`)
        const disks = await diskDB.collection('disks').find().toArray()
        for(let disk of disks) {
            const refresh_token = await utils.bdapis.refreshToken(disk.refresh_token)
            await diskDB.colletion('disks').updateOne({_id: disk._id}, {$set:{refresh_token:refresh_token.data.refresh_token, access_token:refresh_token.data.access_token, }})
        }
    })
    cron.schedule('*/20 * * * * *', async ()=> {
        await task()
        logger.info(`robot task runing`)
    })
    cron.schedule('*/60 * * * * *', async ()=> {
        await pool.query('SELECT 1;')
        logger.info(`check mysql status end`)
    })
}

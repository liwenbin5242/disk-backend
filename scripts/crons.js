const cron = require('node-cron');
const mongodber = require('../utils/mongodber');
const { logger } = require('../utils/logger');
const utils = require('../lib/utils');
const diskDB = mongodber.use('disk');
const {task} = require('./robot')
const moment = require('moment')
module.exports = function jobs() {
    cron.schedule('0 0 5 */1 * *', async () => {
        logger.info(`check bd access_token`)
        const tm = moment().subtract(20, 'days') // 获取20天前的数据进行更新
        const disks = await diskDB.collection('disks').find({uptime: {$lt: new Date(tm)}}).toArray()
        for(let disk of disks) {
            try {
                const refresh_token = await utils.bdapis.refreshToken(disk.refresh_token)
                const res = await diskDB.collection('disks').updateMany({uk: disk.uk}, {$set:{ refresh_token: refresh_token.data.refresh_token, access_token:refresh_token.data.access_token, uptime: new Date}})
                logger.info(`${disk.baidu_name} token已更新`)
            } catch (err) {
                logger.error(`${disk.baidu_name} token更新出错, ${err.message}`)
            }
          
        }
    })
    cron.schedule('*/30 * * * * *', async ()=> {
        // await task()
        logger.info(`robot task runing`)
    })
    // cron.schedule('*/60 * * * * *', async ()=> {
    //     await pool.query('SELECT 1;')
    //     logger.info(`check mysql status end`)
    // })
}

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
        const $match = {uptime: {$lt: new Date(tm)}}
        const disks = await diskDB.collection('disks').aggregate([{$match}, 
            { $group:{_id:{uk:'$uk', app_id:'$app_id'}, uk:{$first:'$uk'}, app_id:{$first:'$app_id'}, refresh_token: {$first:'$refresh_token'}}}, {
                $lookup: {
                    from: 'baidu_apps',
                    let: {
                      fkey: '$app_id',
                    },
                    pipeline: [
                      { $match: { $expr: { $and: [{ $eq: ['$app_id', '$$fkey'] }] } } },
                      {
                        $project: {
                         _id:0,
                         clientId: '$app_key',
                         clientSecret: '$secret_key'
                        }
                      }
                    ],
                    as: 'apps'
                  }
            },
            { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$apps', 0] }, '$$ROOT'] } } }, 
        ]).toArray()
        for(let disk of disks) {
            try {
                const refresh_token = await utils.bdapis.refreshToken(disk.refresh_token,disk.clientId, disk.clientSecret)
                await diskDB.collection('disks').updateMany({uk: disk.uk, app_id:disk.app_id }, {$set:{ refresh_token: refresh_token.data.refresh_token, access_token:refresh_token.data.access_token, uptime: new Date}})
                logger.info(`${disk.baidu_name} token已更新`)
            } catch (err) {
                logger.error(`${disk.baidu_name} token更新出错, ${err.message}`)
            }
          
        }
    })
    cron.schedule('*/30 * * * * *', async ()=> {
        await task()
        logger.info(`robot task runing`)
    })
}

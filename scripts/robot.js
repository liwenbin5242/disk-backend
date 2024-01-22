'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');
const { logger } = require('../utils/logger');

moment.locale('zh-cn');

/**
 * robot
 */
async function task() {
    // 获取运行中 status == 1的task
    const cfgs = await diskDB.collection('robot_config').find({ status: 1 }).toArray();
    for(let cfg of cfgs) {
        // judge the username in the cfg whether expired?
        const user = await diskDB.collection('users').findOne({username: cfg.username, expires: {$gt: new Date}})
        const disk = await diskDB.collection('disks').findOne({_id: ObjectID(cfg.disk_id)})
        if(!user || !disk || !disk.cookie) continue
        let {data: {errno, records=[]}} = await utils.bdapis.newFriendUnreadList(disk.cookie,) 
        if(errno) logger.error(`获取newFriendUnreadList出错,errno:${errno}`) 
        records = _.uniqBy(records.filter(r => {return r.follow_flag === '0'}), e => {
            return e.uk
        }) 
        for(let rec of records) { // 获取没有添加好友的列表
            let {data: {errno, userinfo={}}} = await utils.bdapis.addFriend(disk.cookie, rec.uk, disk.bdstoken, rec.msg_id) 
            if(errno) {
                logger.error(`获取addFriend出错,errno:${errno}`)  
                continue
            }
            if(cfg.first_reply) {  // 添加完成后回复                                        
                const msg = {"send_type":3,"receiver":[`${rec.uk}`],"msg_type":1,"msg":`${cfg.first_reply}`,"fs_ids":[],"receiver_name":[`${rec.uname}`]}
                let {data: {errno}} = await utils.bdapis.sendMsg(disk.cookie, msg)
                if(errno) {
                    logger.error(`发送first reply出错,errno:${errno}`)  
                    await await diskDB.collection('disk_err_log').insertOne({disk_id: cfg.disk_id, username: cfg.username, uname: rec.uname, uk: rec.uk, apiname: 'first reply'})
                }
            }
        }
    }
    return returnData;
}


module.exports = {
    task,
};

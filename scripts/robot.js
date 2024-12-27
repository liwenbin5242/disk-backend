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
    // logger.info(`已读取到${cfgs.length}条配置`)
    for(let cfg of cfgs) {
        // judge the username in the cfg whether expired?
        const user = await diskDB.collection('users').findOne({username: cfg.username, expires: {$gt: new Date}})
        const disk = await diskDB.collection('disks').findOne({_id: ObjectID(cfg.disk_id)})
        if(!user || !disk || !disk.cookie) continue
        let {data: {errno, records=[]}} = await utils.bdapis.newFriendUnreadList(disk.cookie,) 
        if(errno) logger.error(`获取newFriendUnreadList出错,errno:${errno}`) 
        records = _.uniqBy(records.filter(r => {return r.follow_flag === '0' &&  r.status === '1'}), e => {
            return e.uk
        }) 
        for(let rec of records) { // 获取没有添加好友的列表
            // 1. 判断数据库中是否已经添加过
            const friended = await diskDB.collection('disk_friends').findOne({disk_id: cfg.disk_id, uk: rec.uk})
            if(friended){
                continue
            }
            let {data: {errno}} = await utils.bdapis.addFriend(disk.cookie, rec.uk, disk.bdstoken, rec.msg_id) 
            if(errno) {
                logger.error(`获取addFriend出错,errno:${errno}`)  
                continue
            }
            // 数据库中添加记录
            await diskDB.collection('disk_friends').insertOne({disk_id: cfg.disk_id, uk: rec.uk, ctm: new Date, utm: new Date})
            if(cfg.first_reply) {  // 添加完成后回复                                        
                const msg = `{"send_type":3,"receiver":["${rec.uk}"],"msg_type":1,"msg":"${cfg.first_reply}","fs_ids":[],"receiver_name":["${rec.uname}"]}`
                let {data: {errno}} = await utils.bdapis.sendMsg(disk.cookie, msg)
                if(errno) {
                    logger.error(`发送first reply出错,errno:${errno}`)  
                    await await diskDB.collection('disk_err_log').insertOne({disk_id: cfg.disk_id, username: cfg.username, uname: rec.uname, uk: rec.uk, apiname: 'first reply', ctm:new Date})
                }
            }
        }
        // 查询此配置下规则列表
        const rules = await diskDB.collection('robot_rule').find({config_id: cfg._id.toString()}).toArray()
        if( rules.length) {
            // 拉取msg box
            let {data: {errno, sessions=[]}} = await utils.bdapis.imboxMsgPull(disk.cookie)
            if(errno) logger.error(`获取会话出错,disk_id:${disk._id},cookie:${disk.cookie}`)
            let unreadSessions = sessions.filter(session => {return session.unreadcount > 0 && session.account_type===0 && session.sessiontype === 3})
            for (let unreadSession of unreadSessions ) {
                // 设置消息已读
                let {data: {errno}} = await utils.bdapis.clearMsgBox(disk.cookie,unreadSession.sessionid)
                if(errno) logger.error(`清除session出错,disk_id:${disk._id},cookie:${disk.cookie}`)
                const msgrecords = unreadSession.msgrecord.filter(rec => {return rec.msgtype===100 &&  rec.sendtype===3 && rec.from_uk!== disk.uk}).slice(0, unreadSession.unreadcount)
                let matched = false
                for(let  msgrecord of msgrecords ) {
                    const cdkey = await diskDB.collection('robot_cdkey').findOne({key: msgrecord.msg.trim(), used: false})
                    if(cdkey){
                        const rule = await diskDB.collection('robot_rule').findOne({config_id: cfg._id.toString(), classify_id: cdkey.classify_id.toString()})
                        if(rule) matched = true
                        let group_name
                        let reply_files
                        if(rule.reply_content) { //  发消息
                            const msg = `{"send_type":3,"receiver":["${msgrecord.from_uk}"],"msg_type":1,"msg":"${rule.reply_content}","fs_ids":[],"receiver_name":["${unreadSession.sessionname}"]}`
                            let {data: {errno}} = await utils.bdapis.sendMsg(disk.cookie, msg)
                            if(errno) logger.error(`回复消息出错,disk_id:${disk._id},cookie:${disk.cookie}`)
                        }
                        if(rule.groups.length) { // 进入群组
                            for(let group of rule.groups) {
                                let {data} =await utils.bdapis.addUser(disk.cookie, group.gid, JSON.stringify([msgrecord.from_uk]), disk.bdstoken)
                                if(data.errno == '2100') logger.error(`已经在群组了`)
                                if(data.errno == '2119') logger.error(`群组满`)
                                if(data.errno == '0') {
                                    logger.info(`添加成功`)
                                    group_name = data.groupinfo[0].name
                                    break
                                }
                            }
                        }
                        if(rule.reply_files) {
                            // 回复文件
                        }
                        await diskDB.collection('robot_cdkey').updateOne({key: msgrecord.msg.trim(), used: false}, {$set: {config_id: cfg._id.toString(), sessionname: unreadSession.sessionname, used: true, usetm: new Date, reply_content: rule.reply_content, group_name, reply_files}})
                    } else {
                        // const msg = `{"send_type":3,"receiver":["${msgrecord.from_uk}"],"msg_type":1,"msg":"抱歉,消息未识别成功请联系客服或重试","fs_ids":[],"receiver_name":["${unreadSession.sessionname}"]}`
                        // let {data: {errno}} = await utils.bdapis.sendMsg(disk.cookie, msg)
                        // if(errno) logger.error(`回复消息出错,disk_id:${disk._id},cookie:${disk.cookie}`)
                        logger.error('robot_cdkey不匹配,此次消息发送的是:', msgrecord.msg)
                    }
                }
            }
        }
    }
}


module.exports = {
    task,
};

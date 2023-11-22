'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');

moment.locale('zh-cn');
/**
 * 生成CDkey
 * @param {数量} num 
 * @param {天} day 
 */
async function postCDkey(num, day,) {
    let returnData = {};
    const array = []
    for (let i=0; i<num; i++) {
        array.push({
            username:'',
            actived: false,
            activedtm: '',
            expiration: day,
            ctm: new Date
        })
    }
    await diskDB.collection('cdkey').insert(array)
    return returnData
}

/**
 * 删除CDkey
 * @param {id} id 
 */
async function deleteCDkey(id) {
    let returnData = {};
    await diskDB.collection('cdkey').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * CDkey列表
 * @param {}  
 */
async function getCDkeyList(actived, limit = 20, offset = 0,) {
    let returnData = {};
    const query = {}
    if(typeof actived !== "undefined") {
        query.actived = actived
    }
    returnData.list = await diskDB.collection('cdkey').find(query).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
    returnData.total = await diskDB.collection('cdkey').countDocuments(query)
    return returnData
}

module.exports = {
    postCDkey,
    deleteCDkey,
    getCDkeyList
};

'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const moment = require('moment');
moment.locale('zh-cn');

async function postData(data) {
    let returnData = {};
    await diskDB.collection('scan_data').insertOne({ data, ctm: new Date() });
    return returnData;
}

async function getNotice() {
    let returnData = {};
    returnData = await diskDB.collection('scan_notice').findOne();
    return returnData;
}

module.exports = {
    postData,
    getNotice,
};

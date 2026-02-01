'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const moment = require('moment');
const _ = require('lodash');
moment.locale('zh-cn');
const { ObjectID } = require('mongodb');

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

async function putNotice(data) {
    let returnData = {};
    await diskDB.collection('scan_notice').updateOne({_id: new ObjectID(data.id)}, { $set: { notice: data.notice } });
    return returnData;
}

async function getVersions() {
    let returnData = {};
    returnData = await diskDB.collection('scan_versions').find().sort({ctm: -1}).toArray();
    return returnData;
}

async function postVersions(data) {
    let returnData = {};
    await diskDB.collection('scan_versions').insertOne({ ...data, ctm: new Date() });
    return returnData;
}

async function deleteVersions(data) {
    let returnData = {};
    await diskDB.collection('scan_versions').deleteOne({ _id: new ObjectID(data.id) });
    return returnData;
}

async function putVersions({id, ...q}) {
    let returnData = {};
    await diskDB.collection('scan_versions').updateOne({_id: new ObjectID(id)}, { $set: { ...q, utm: new Date() } });
    return returnData;
}

module.exports = {
    postData,
    getNotice,
    getVersions,
    putNotice,
    postVersions,
    deleteVersions,
    putVersions
};

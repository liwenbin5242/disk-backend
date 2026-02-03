const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const { ObjectID } = require('mongodb');

/**
 * 获取文件的m3u8地址
 */
async function genBDToken(req) {

}

module.exports = {
    genBDToken
};
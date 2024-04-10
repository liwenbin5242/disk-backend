const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const { ObjectID } = require('mongodb');
const { decodeJwt } = require('../lib/utils');

/**
 * 获取文件的m3u8地址
 */
async function genBDToken(req) {
    const type = {
        1: 'M3U8_AUTO_1080',
        2: 'M3U8_HLS_MP3_128'
    };
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(req.query.disk_id),}); 
    const username = req.query.username
    const user = await diskDB.collection('subscribers').findOne({ username});
    // 如果是会员则不限制，如果非会员则扣1积分，积分不足则返回错误
    if (user && user.expires > new Date()) { // 此处urlencode
    } else if(user && user.level == 1 && user.coins > 0) {
        await diskDB.collection('subscribers').updateOne({ username,}, {$set:{conins: {$inc: -1},}})
    } else {
        return '';
    }
    diskDB.collection('subscriber_files').updateOne({ username, disk_id, path:req.query.path}, {$set:{utm: new Date,}}, {upsert: true});     
    return `/rest/2.0/xpan/file?method=streaming&access_token=${disk.access_token}&path=${encodeURIComponent(req.query.path) }&type=${type[req.query.file_type]}`;
}

module.exports = {
    genBDToken
};
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const { ObjectID } = require('mongodb');

/**
 * 获取access_token
 */
async function genBDToken(req) {
    const type = {
        1: 'M3U8_AUTO_1080',
        2: 'M3U8_HLS_MP3_128'
    };
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(req.query.belongs) });
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(req.query.diskid), username: user.username }); 
    return `/rest/2.0/xpan/file?method=streaming&access_token=${disk.access_token}&path=${req.query.path}&type=${type[req.query.filetype]}`; 
}

module.exports = {
    genBDToken
};
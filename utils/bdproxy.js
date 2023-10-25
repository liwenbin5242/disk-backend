const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const { ObjectID } = require('mongodb');

/**
 * 获取文件的m3u8地址
 */
async function genBDToken(req) {
    const type = {
        1: 'M3U8_AUTO_1080',
        2: 'M3U8_HLS_MP3_128'
    };
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(req.query.diskid),}); 
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(req.query.userid) });
    // 如果是会员则不限制，如果非会员则扣积分，积分不足则返回错误
    if (user.role === 'admin' || (user.level === 2 && user.expires > new Date()) || (user.level === 3) || (user.coins > 0)) {
        if (user.coins > 0 && user.level == 1) {
            await diskDB.collection('users').updateOne({ _id: ObjectID(req.query.userid) }, { $inc: { coins: -1 } });
        }    
        return `/rest/2.0/xpan/file?method=streaming&access_token=${disk.access_token}&path=${req.query.path}&type=${type[req.query.filetype]}`;     
    } else {
        return '';
    }
  
}

module.exports = {
    genBDToken
};
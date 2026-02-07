const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require('config');
const urlencode = require('urlencode');
const urldecode = require('urldecode');
const axios = require('axios');
const request = require('request');
const fs = require('fs');
const qs = require('qs');
const node_path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const rediser = require('../utils/rediser');
const { log } = require('console');
/**
 * argon2加密字符串
 */
async function argonEncryption(text) {
    const argonOptions = {
        type: argon2.argon2id, // 加密模式：argon2i/argon2d/argon2id
    };
    const argon2Hash = await argon2.hash(text, argonOptions);
    return argon2Hash; // 加密字符串
}
/**
 * argon2验证字符串
 */
async function argonVerification(text, encryptedText) {
    const verify = await argon2.verify(encryptedText, text);

    return verify; // 是否相同 true/false
}

/**
 * jwt解析
 */
async function decodeJwt(token) {
    const data = await jwt.verify(token, config.get('privateKey'));
    return data;
}

/**
 * jwt签名
 */
async function encodeJwt(payload) {
    try {
        const token = jwt.sign(payload, config.get('privateKey'), {
            expiresIn: '120000h',
        });
        return token;
    } catch (err) {
        err;
    }
}

/**
 * @function md5
 * @param {*} data - 需要进行md5 hash的数据
 * @param {string} [digest='hex'] - 编码格式,默认为hex
 * @return md5后的字符串
 */
function md5(data, digest) {
    return crypto
        .createHash('md5')
        .update(data, 'utf8')
        .digest(digest || 'hex');
}
/**
 * @function md5ID 生成mongdo主键
 * @param {*} data - 需要进行md5 hash的数据
 * @param {string} [digest='hex'] - 编码格式,默认为hex
 * @param {number} [start=4] - slice开始位,默认为4
 * @param {end} [end=-4] - slice结束位,默认为-4
 * @return md5后的字符串
 */
function md5ID(data, digest) {
    return crypto
        .createHash('md5')
        .update(data, 'utf8')
        .digest(digest || 'hex')
        .slice(4, -4);
}

async function urlecodes(req, res, next) {
    for (let i in req.query) {
        req.query[i] = await urlencode(req.query[i]);
    }
    next();
}

function urldecodes(params) {
    return urldecode(params);
}

function machidAuth() {
   return async function (req, res, next) {
        const machid = await rediser.get('machid')
        if( machid ) {
            return next();
        } else {
            return res.json({ code: 1000, message: '已过期请续约', data: {} });
        }
   }
}

function responseTime() {
   return function (req, res, next) {
        req._startTime = new Date() // 获取时间 t1
        let calResponseTime = function () {
            let now = new Date(); //获取时间 t2
            let deltaTime = now - req._startTime;
            logger.info(`请求耗时: ${deltaTime}ms`);
        }
        res.once('finish', calResponseTime);
        return next();
   }
}

  /**
   *
   * @param {*} key
   * @param {*} expires
   * @returns
   */
function randomCode() {
    let code = ''
    let codeLength = 6 //验证码的长度
    // let selectChar = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z') //所有候选组成验证码的字符，当然也可以用中文的
    let selectChar = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9) //所有候选组成验证码的字符，当然也可以用中文的
    for (let i = 0; i < codeLength; i++) {
      let charIndex = Math.floor(Math.random() * 10)
      code += selectChar[charIndex]
    }
    return code
  }

function ipControl() {
   return async function (req, res, next) {
        const ip = await rediser.get('ips_' + req.ip.slice(7))
        if(!ip) {
            /**同一用户只能24小时内访问两次 */
            await rediser.set('ips_' + req.ip.slice(7), req.ip.slice(7), 1)
            next()
        } else {
           // res.json({ code: 1000, message: '访问频繁,请联系微信:xxx解除限制', data: {} })
           next()
        }
   }
}

function array2Tree(items, id = '_id', parent_id = 'parent_id', children = 'children') {
    const tree = [];
    const lookup = {};

    // First map the nodes of the array to an object -> create a hash table.
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        lookup[item[id]] = { ...item, [children]: [] };
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item[parent_id] != '') {
            // If we have a parent_id we can use it to find parent in tree
            if(lookup[item[parent_id]] && lookup[item[parent_id]][children]) {
                lookup[item[parent_id]][children].push(lookup[item[id]]);
            }
        } else {
            // If no parent_id then the item is root level
            tree.push(lookup[item[id]]);
        }
    }

    return tree;
}

/**
 * 百度网盘api
 */
const bdapis = {
    // 刷新access_token
    refreshToken: async (refresh_token,clientId,clientSecret) => {
        const data = await axios.get(
            `https://openapi.baidu.com/oauth/2.0/token?grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${clientId}&client_secret=${clientSecret}`
        );
        return data
    },
    // code换取token
    code2token: async (code,clientId,clientSecret,redirectUri) => {
        let data = {};
        try {
            data = await axios.get(
                `https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`
        )} catch(error) {
            logger.error(error.message);
        };
        return data
    },
    // 通过access_token获取用户
    getbdUserByToken: async access_token => {
        let data = {};
        try {
            data = await axios.get(`https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo&access_token=${access_token}`);
        } catch (err) {
            logger.error(err.message);
        }
        return data;
    },
    // 获取网盘容量信息
    getQuotaByToken: async access_token => {
        let data = {};
        try {
            data = await axios.get(`https://pan.baidu.com/api/quota?access_token=${access_token}`);
        } catch (err) {
            logger.error(err.message);
        }
        return data;
    },
    // 获取文件列表
    getFileListByToken: async (access_token, dir, order, web, folder, showempty) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/file?method=list&access_token=${access_token}&dir=${dir}&order=${order}&web=1&folder=${folder}&showempty=${showempty}`);
    },
    // 获取文档列表
    getDocListByToken: async (access_token, parent_path) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/file?method=doclist&access_token=${access_token}&parent_path=${parent_path}`);
    },
    // 获取视频列表
    getVideoListByToken: async (access_token, parent_path) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/file?method=doclist&access_token=${access_token}&parent_path=${parent_path}`);
    },
    // 获取bt列表
    getBTListByToken: async (access_token, parent_path) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/file?method=btlist&access_token=${access_token}&parent_path=${parent_path}`);
    },
    // 获取分类文件列表
    getCategoryListByToken: async (access_token, category, parent_path) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/multimedia?method=categorylist&access_token=${access_token}&category=${category}&parent_path=${parent_path}`);
    },
    // 搜索文件
    searchFileByToken: async (access_token, key, dir) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/file?method=search&access_token=${access_token}&key=${key}&dir=${dir}&web=1&recursion=1`);
    },
    // 查询文件信息
    getFilemetasByToken: async (access_token, fsids) => {
        return await axios.get(`https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&access_token=${access_token}&thumb=1&fsids=${ JSON.stringify(fsids)}&dlink=1&extra=1&needmedia=1`);
    },
    // 管理文件
    fileManager: async (access_token, opera, filelist) => {
        return await axios.post(`http://pan.baidu.com/rest/2.0/xpan/file?method=filemanager&opera=${opera}&access_token=${access_token}`, `async=1&filelist=${JSON.stringify(filelist)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    },
    // 管理文件
    getFileSteam: async (access_token, path, filetype) => {
        const type = {
            1: 'M3U8_AUTO_1080',
            2: 'M3U8_HLS_MP3_128'
        }
        return await axios.post(`https://pan.baidu.com/rest/2.0/xpan/file?method=streaming&access_token=${access_token}&path=${path}&type=${type[filetype]}`, {
            headers: {
                Host:'pan.baidu.com	',
                'User-Agent': 'xpanvideo;netdisk;iPhone13;ios-iphone;15.1;ts'
            },
        });
    },
    // 获取bdstoken
    getBDstoken: async(cookie) => {
        return await axios({
            url: `https://pan.baidu.com/api/loginStatus?clienttype=0&app_id=250528&web=1&channel=chunlei`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie,
            },
        });
    },
    // getGroups
    getGroups: async (cookie, start, limit) => {
        return await axios({
            url: `https://pan.baidu.com/mbox/group/list?start=${start}&limit=${limit}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie,
            },
        });
    },

    // 获取好友列表
    getFollowList: async (cookie, start, limit) => {
        return await axios({
            url: `https://pan.baidu.com/mbox/relation/getfollowlist?start=${start}&limit=${limit}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie,
            },
        });
    },
    // 获取未读新朋友列表
    newFriendUnreadList: async (cookie) => {
        return await axios({
            url: `https://pan.baidu.com/mbox/msg/newfriendunreadlist?clienttype=0&app_id=250528&web=1&last_msg_time=${+new Date-60 * 1000}`, 
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie,
            },
        });
    },
    // 添加朋友
    addFriend: async(cookie, uk, bdstoken, messageId) => {
        const t= +new Date
        return await axios({
            url: `https://pan.baidu.com/mbox/relation/addfriend?clienttype=0&app_id=250528&web=1&uk=${uk}&action=accept&type=normal&scene=0&from=message&bdstoken=${bdstoken}&messageId=${messageId}&t=${t}`, 
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie,
            },
        });
    },
    // 获取未读的消息会话信息
    imboxMsgPull: async (cookie,) => {
        let data = qs.stringify({
            pulltype: 0,
            sids: '[]',
            needprofile: 1,
            identity: 0,
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/imbox/msg/pull?clienttype=0&app_id=250528&web=1`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        return await axios(config);
    },
    // 清空未读消息
    clearMsgBox: async (cookie,sid) => {
        let data = qs.stringify({
            sid,
            lastreadtime: +new Date,
            timestamp: ((+new Date)/1000).toFixed(),
            batch: 0,
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/imbox/msg/setzero`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        return await axios(config);
    },
    // 获取会话消息
    getSessionMsg: async (cookie,sid) => {
        let data = qs.stringify({
            pulltype: 1,
            sids: [sid],
            needprofile: 1,
            identity: 0,
            showlink:true
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/imbox/msg/pull?clienttype=0&app_id=250528&web=1`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        return await axios(config);
    },
    // 发送消息
    sendMsg: async (cookie,msg) => {
        let data = qs.stringify({
            data:msg
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/imbox/msg/send?clienttype=0&app_id=250528&web=1`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        return await axios(config);
    },
    // 添加用户到群组会话
    addUser: async (cookie,gid, user_list, bdstoken) => {
        let config = {
            method: 'get',
            url: `https://pan.baidu.com/mbox/group/adduser?clienttype=0&app_id=250528&web=1&gid=${gid}&user_list=${user_list}&bdstoken=${bdstoken}`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        return await axios(config);
    },
    // getGrouplistshare
    getGrouplistshare: async (cookie, gid, limit) => {
        return await axios({
            url: `https://pan.baidu.com/mbox/group/listshare?limit=${limit}&type=2&gid=${gid}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie,
            },
        });
    },
    // getGroupshareinfo
    getGroupshareinfo: async (cookie, msg_id, page, num, from_uk, gid, fs_id) => {
        return await axios({
            url: `https://pan.baidu.com/mbox/msg/shareinfo?msg_id=${msg_id}&page=${page}&num=${num}&from_uk=${from_uk}&gid=${gid}&type=2&app_id=250528`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie,
            },
        });
    },
    /**
     * 文件分享
     * @param {用户cookie} cookie
     * @param {失效时间} period
     * @param {提取码} pwd
     * @param {渠道} schannel
     * @param {文件id} fs_id
     * @param {百度文件转存token} bdstoken
     * @returns 
     */
    fileShare: async (cookie, period, pwd, channel_list, schannel, fid_list) => {
        let data = qs.stringify({
            period,
            pwd,
            channel_list,
            schannel,
            fid_list: JSON.stringify(fid_list),
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/share/set`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data,
        };
        return await axios(config);
    },
    /**
     * 转存文件到指定目录
     * @param {用户cookie} cookie
     * @param {消息id} msg_id
     * @param {保存网盘路径} path
     * @param {分享人uk} from_uk
     * @param {群组id} gid
     * @param {文件id} fs_id
     * @param {百度文件转存token} bdstoken
     * @returns 
     */
    fileTransfer: async (cookie, msg_id, path, from_uk, gid, fs_id, bdstoken) => {
        const data = `from_uk=${from_uk}&msg_id=${msg_id}&path=${path}&ondup=newcopy&async=1&type=2&gid=${gid}&fs_ids=[${fs_id}]`;
        const config = {
            method: 'post',
            url: `https://pan.baidu.com/mbox/msg/transfer?bdstoken=${bdstoken}&channel=chunlei&web=1&app_id=250528&clienttype=0`,
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
                'Cookie': cookie,
            },
            data: data
        };
        return await axios(config);
    },
    // 预上传
    filePrecreate: async (access_token, path, isdir, size, block_list) => {
        return await axios.post('http://pan.baidu.com/rest/2.0/xpan/file', `path=${path}&size=${size}&isdir=${isdir}&autoinit=1&rtype=3&block_list=${JSON.stringify(block_list)}`, {
            params: {
                method: 'precreate',
                access_token,
            },
            headers: {
                'User-Agent': 'pan.baidu.com',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    },
    // 分片上传
    fileSuperfile2: async (access_token, path, uploadid, partseq, file, tempfile) => {
        if (!tempfile) {
            // 生成临时文件
            tempfile = node_path.join(__dirname, `../temp/${md5(file.buffer)}/`, `${file.originalname}`);
            await fs.writeFileSync(tempfile, file.buffer);
        }
        let formData = {
            data: fs.createReadStream(tempfile),
        };
        return await new Promise((resolve, reject) => {
            request.post(
                {
                    url: `https://d.pcs.baidu.com/rest/2.0/pcs/superfile2?method=upload&access_token=${access_token}&type=tmpfile&path=${urlencode(path)}}&uploadid=${uploadid}&partseq=${partseq}`,
                    formData: formData,
                },
                (err, httpResponse, body) => {
                    if (err) {
                        return reject(err);
                    }
                    fs.unlinkSync(tempfile);
                    return resolve(JSON.parse(body));
                }
            );
        });
    },
    // 创建文件
    fileCreate: async (access_token, path, size, isdir, block_list, uploadid) => {
        let data = qs.stringify({
            path,
            size,
            isdir,
            rtype: '3',
            uploadid,
            block_list: JSON.stringify(block_list),
        });
        let config = {
            method: 'post',
            url: `https://pan.baidu.com/rest/2.0/xpan/file?method=create&access_token=${access_token}`,
            headers: {
                'User-Agent': 'pan.baidu.com',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: data,
        };
        return await axios(config);
    },
};

const wechatapis = {
  // 获取接口调用凭据
    getAccessToken: async (appid, secret) => {
        const data = await axios.get( `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`);
        return data?.data?? {}
    },
    // 获取接口调用凭据
    getwxacodeunlimit: async (access_token, code) => {
        const data = await axios.post( `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${access_token}`, {
            scene: code
        },
        { responseType: 'arraybuffer' });
        return data?.data?? {}
    },
}
async function promiseTasks(tasks, api) {
    let return_data = [];
    const promiseTasks = tasks.map(task => {
        return bdapis[api](task.access_token);
    });
    try {
        await Promise.all(promiseTasks).then(result => {
            return_data = result;
        });
    } catch (err) {
        logger.error(err.message);
    }
    return return_data;
}

/**
 * 分片文件合并
 * @param {*} arr 
 * @param {*} target 
 * @returns 
 */
async function mergeFile (arr, target) {
    return await new Promise((resolve, reject) => {
      const writeTar = fs.createWriteStream(target)
      mergeFileInner(arr, writeTar, (res) => {
        resolve({ done: res })
      })
    })
  }
  
function mergeFileInner (arr, writeTar, cb) {
    if (!arr.length) {
      console.log('文件合并完成')
      writeTar.close();
      cb(true)
      return;
    }
    const item = arr.shift()
    const reader = fs.createReadStream(item)
    reader.pipe(writeTar, { end: false })
    reader.on('end', () => {
      fs.unlinkSync(item)
      mergeFileInner(arr, writeTar, cb)
    })
    reader.on('error', (err) => {
      console.log('文件合并出错', err.message)
      writeTar.close();
      cb(false)
    })
}

/**
 * 转换文件流为base64
 * @param {*} file 
 * @returns 
 */
function transfer() {
   return async function (req, res, next) {
    // 如果req的path包含 api2/decrypt 与 api/other/save_url 则调用 http://127.0.0.1:3000
     if(req.path.includes('api2/decrypt') || req.path.includes('api/other/save_url') ) {
        const result = await axios.post('http://127.0.0.1:3000/api/transfer', {
            "path":"/",
            "cookie":"b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; b-user-id=1f6bf52d-b0b7-e097-a865-fe5397b09bd2; __sdid=AAQefbLxmWtvtjdc9VFz8z2Kk+EGRBEG9ygXQXREgw4z5gv6oTvSPXJhus8/3gPWEXksmNE/AySo8o50LzMkFYiDyr+pq2X1ZtZmfLg9zoOLOQ==; _UP_D_=pc; _UP_A4A_11_=wba29198c5ae47fbb9e81eb4fedc4664; _UP_30C_6A_=sta296201f4gb76vcdb723w9rl0z8029; _UP_TS_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_E37_B7_=sg1a7fbb920255ff297682bf87ec77d1b40; _UP_TG_=sta296201f4gb76vcdb723w9rl0z8029; _UP_335_2B_=1; __pus=2402e37f4a873eaaa9a3d1377c0a959bAASOXZVXFVkCsgngo4zl/wvCGEpirw114R4jYwhYnxX9eJaf3NmBa8jbUpMeNI1HzVXxHeqX07/Uda3q/tsYeu8K; __kp=29705270-fce6-11f0-bffe-05105f217963; __kps=AARVL1p0yub6Ld6xFpIaKZBu; __ktd=uvJoPN9QS2g2OBYY0i3KtQ==; __uid=AARVL1p0yub6Ld6xFpIaKZBu; __wpkreporterwid_=607d3eb7-2e6b-46f2-0203-02d44f155a7e; cs_xcustomer_switch_user_key=27640a8c-23e6-4a81-83e6-c43b1af88b8b; xlly_s=1; __chkey=; _er_uuid=BHHADAAIIACBG-HcbXna91IX; _er_is_back_to_node=0; ctoken=web_i-YmlnnGMCmfYS0K60sy; web-grey-id=8b419d34-1efd-f16e-83b8-ef22b7e8f437; web-grey-id.sig=CWKc66fOf0giz31FYaJVMyNmQS-lodL4vR4lS4q2J2M; grey-id=c63878d3-ca1f-c9c0-0a4b-364d41aa2ae8; grey-id.sig=bJLgCPul-vHR7HBCDFV_o1AnR_ytVTjgVXjW58XFrxY; isQuark=true; isQuark.sig=hUgqObykqFom5Y09bll94T1sS9abT1X-4Df_lzgl8nM; __puus=613ab2f958566bbded3069013bf9d51fAAR5rduFrpXR/VxfoEQptOjtAuAwB7gQGSjyDrEMv3S0ihh7qregN/YeP5hj7eT5NBmEz2nMo5XJ2eN3CNOzj6RmGkiHSjodod6XokcDONlfoYWy5HRooIBRH4BCa8DigBQOtVwzBiQe8dAk5H2Od8tAKzFNPhs5f9cTqlR+VWzxtfAVjvr5zdHB950zjRMALMnCgZ7ER61vmy3gPblJoKam; tfstk=gKJtoewrJ20MM7DIyRcnm9tkQvmHWXxwYF-7nZbgGeLp0ECcG1jGHsT1-dfcCNYLAGYWIr1fGMNBrGU6COTmHZtP8RYm_s2vJij_GrwbC61vygz6nZ11O96wKC2cSVWvcUXxr4DoEh-NUtgortNAURX5VRw_ossQdtjvfPQ-Eh-N3kr3lbABbxHkxnS1hE6COis1hG6b1DUCcww1cRsbRDIVRtsb1twIdgIzl-1XlHid0w_fh1TfdDIVRZ6fhjyZkwZ1o-dpApO0T4_Yh-9dX6GHfwaVOpsO6at6B-wb4GCOPh_KWSHQy6tVMKr4H_x6aESW5PgAupKBCQTS-5b6wiKkMUH73MR6Wp1vKmkJAOIANt1Lc-tddZ1WITM7JMRBjI9wWoefbdvlMa5Kc-5cdLfWNFEq4H61cE5yn4yN5ntyUQX-BzS9O3Bd47pkeiZ8raI01DnLgS51YwJa-Fic5QaPvamtHSPVTDSdrDnLgS51YMQoXmF4g6oF.; isg=BI-P2VQDOgMTcj4CUBMt2s-kHiOZtOPWb2W0TKGcCP4FcK5yqYXCJnhidqBOCLtO",
            "url": res.data
        })
     }
   }
}

module.exports = {
    argonVerification,
    argonEncryption,
    bdapis,
    randomCode,
    decodeJwt,
    encodeJwt,
    md5,
    md5ID,
    promiseTasks,
    responseTime,
    urlecodes,
    urldecodes,
    wechatapis,
    machidAuth,
    ipControl,
    array2Tree,
    mergeFile,
    transfer
};

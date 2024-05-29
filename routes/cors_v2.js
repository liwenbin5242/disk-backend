'use strict';
const express = require('express');
const router = express.Router();
const corsServ = require('../modules/cors_v2');
const diskServ = require('../modules/disk');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const { urldecodes, decodeJwt } = require('../lib/utils');

/**
 * @api {post} /api/cors/v2/user/register 00.用户注册
 * @apiName 用户注册
 * 
 * @apiGroup 前台页面api
 * @apiParam {String} code 代理用户code，http://aassc.cn/aaaaaa，aaaaaa即后台用户code
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/user/register', reqHandler(async function(req, res) {
    const {code, username, password} = req.body;
    const result = await corsServ.postUserRegister(code, username, password);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /api/cors/v2/user/login 01.用户登陆
 * @apiName 用户登陆
 * 
 * @apiGroup 前台页面api
 * @apiParam {String} code 代理用户code，http://aassc.cn/aaaaaa，aaaaaa即后台用户code
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/user/login', reqHandler(async function(req, res) {
    const { code, username, password} = req.body;
    const result = await corsServ.postUserLogin(code, username, password);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors/v2/user/info 02.获取用户基本信息
 * @apiName 获取用户基本信息
 * 
 * @apiGroup 前台页面api
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/user/info', reqHandler(async function(req, res) {
    const { username } = req.query;
    const result = await corsServ.getUserInfo( username, );
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors/v2/uconfig 03.通过后台用户code编码获取后台用户的盘目录配置信息（banner图、微信二维码等信息、）
 * @apiName 通过后台用户code编码获取后台用户的盘配置信息
 * 
 * @apiGroup 前台页面api
 * @apiParam {String} code 后台用户code，http://aassc.cn/aaaaaa，aaaaa即后台用户code
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Array} banners banner图
 * @apiSuccess {String} vx 微信图片地址
 * @apiSuccess {String} name 名称
 * @apiSuccess {String} title title名称
 * @apiSuccess {String} notice 使用提示
 */
router.get('/uconfig', reqHandler(async function(req, res) {
    const {code} = req.query;
    const result = await corsServ.getUserConfig(code);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors/v2/disks/paths 04.通过后台用户code获取共享的网盘目录列表(目录列表是在后台自己创建的一个树状目录)
 * @apiName 通过后台用户code获取共享的网盘目录列表
 * @apiGroup 前台页面api
 * @apiParam   {String} code 后台用户code
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Array} paths 文档数据
 * @apiSuccess {String} paths._id 文档id
 * @apiSuccess {String} paths.disk_id 对应disk_id
 * @apiSuccess {String} paths.title 文档标题名称
 * @apiSuccess {String} paths.name 文件名称
 * @apiSuccess {String} paths.path 路径
 * @apiSuccess {String} paths.category 文件类型
 */
router.get('/disks/paths', reqHandler(async function(req, res) {
    const { code, parent_id ='' } = req.query;
    const result = await corsServ.getUserShareDisks(code, parent_id);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors/v2/disks/files 02.获取用户下共享的网盘文件目录列表
 * @apiName 获取用户下共享的网盘文件列表
 * @apiGroup 弃用
 * @apiParam {String} disk_id 网盘id
 * @apiParam {String} dir 目录
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.list 文件数组
 * @apiSuccess {String} data.list.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'
 */
router.get('/disks/files', reqHandler(async function(req, res) {
    let { disk_id, dir} = req.query;
    const result = await corsServ.getUserShareV2( disk_id, urldecodes(dir || ''),);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors/v2/disks/files/search 03.搜索文件(通过api搜索)
 * @apiName 搜索文件
 * @apiGroup 前台页面api
 * @apiParam {String} diskid 网盘id
 * @apiParam {String} dir 目录
 * @apiParam {String} key 目录
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.list 文件数组
 * @apiSuccess {String} data.list.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'

 */
router.get('/disks/files/search', reqHandler(async function(req, res) {
    let { diskid, dir, key} = req.query;
    const result = await corsServ.searchFilesShareV2( diskid, urldecodes(dir || ''), key);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /cors/v2/disks/files/permission 05.获取文件许可
 * @apiName 获取文件许可
 * @apiGroup 前台页面api
 * @apiParam {String} disk_id 网盘id
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组

 */
router.post('/disks/files/permission', reqHandler(async function(req, res) {
    let { path, disk_id} = req.body;
    const token = req.headers.authorization.slice(7)
    const result = await corsServ.getFilesPermission( disk_id, path, token);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


/**
 * @api {post} /cors/v2/disks/files/links 03.查询文件详细信息
 * @apiName 查询文件详细信息
 * @apiGroup 网盘模块
 *
 * @apiParam {String} fs_ids 文件id.
 * @apiParam {String} disk_id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/disks/files/links', reqHandler(async function(req, res) {
    const {fs_ids, disk_id} = req.body ; 
    const result = await diskServ.getFiles(disk_id, fs_ids);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));


/**
 * @api {post} /api/cors/v2/user/dokey 04.激活cdkey
 * @apiName 激活cdkey
 * @apiGroup cdkey
 *
 * @apiParam {string} cdkey 

 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/user/dokey',  reqHandler(async function(req, res) {
    const {key, username} = req.body
    const result = await corsServ.activateCDkey(username, key)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /api/cors/v2/agent/info 04.获取轮播图
 * @apiName 获取轮播图
 * @apiGroup code
 *
 * @apiParam {string} code 

 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/agent/info',  reqHandler(async function(req, res) {
    const { code} = req.query
    const result = await corsServ.getAgentInfo(code)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


module.exports = router;

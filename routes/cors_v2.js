'use strict';
const express = require('express');
const router = express.Router();
const corsServ = require('../modules/cors_v2');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const { urldecodes } = require('../lib/utils');

/**
 * @api {get} /api/cors_v2/uconfig 00.通过后台用户code编码获取后台用户的盘配置信息
 * @apiName 通过后台用户code编码获取后台用户的盘配置信息
 * 
 * @apiGroup 前台页面api
 * @apiParam {String} code 用户code
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Array} banners banner图
 * @apiSuccess {String} vx 微信图片地址
 * @apiSuccess {String} name 名称
 */
router.get('/uconfig', reqHandler(async function(req, res) {
    const {agentid} = req.query;
    const result = await corsServ.getUserConfig(agentid);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors_v2/disks/list 01.通过用户id获取共享的网盘列表
 * @apiName 通过网盘id获取文件列表
 * @apiGroup 前台页面api
 * @apiParam {String} agentId 用户id
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Array} disks 网盘数组
 * @apiSuccess {String} disks.diskid 网盘id
 * @apiSuccess {String} disks.name 网盘名称
 */
router.get('/disks/list', reqHandler(async function(req, res) {
    const {} = req.query;
    const result = await corsServ.getUserShareDisks();
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors_v2/disks/files 02.获取用户下共享的网盘文件目录列表
 * @apiName 获取用户下共享的网盘文件列表
 * @apiGroup 前台页面api
 * @apiParam {String} diskid 网盘id
 * @apiParam {String} dir 目录
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.list 文件数组
 * @apiSuccess {String} data.list.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'

 */
router.get('/disks/files', reqHandler(async function(req, res) {
    let { diskid, dir} = req.query;
    const result = await corsServ.getUserShareV2( diskid, urldecodes(dir || ''),);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors_v2/disks/files/search 03.搜索文件
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

module.exports = router;

'use strict';
const express = require('express');
const router = express.Router();
const robotServ = require('../modules/robot');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');

/**
 * @api {post} /api/robot/config 01.添加机器人配置
 * @apiName 添加机器人配置
 * @apiGroup 机器人
 *
 * @apiParam {string} name 配置名称.
 * @apiParam {string} disk_id 网盘id.
 * @apiParam {string} disk_name 网盘名称.
 * @apiParam {string} first_reply 首次回复.
 * @apiParam {string} nomatch_reply 无匹配回复.
 * @apiParam {string} repeat_reply 重复回复.
 * @apiParam {string} notice 群通知.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/config',  reqHandler(async function(req, res) {
    const {name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice} = req.body
    const {username} = req.user
    const result = await robotServ.postConfig( name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, username )
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {put} /api/robot/config 02.修改机器人配置
 * @apiName 修改机器人配置
 * @apiGroup 机器人
 *
 * @apiParam {string} _id 配置id.
 * @apiParam {string} name 配置名称.
 * @apiParam {string} disk_id 网盘id.
 * @apiParam {string} disk_name 网盘名称.
 * @apiParam {string} first_reply 首次回复.
 * @apiParam {string} nomatch_reply 无匹配回复.
 * @apiParam {string} repeat_reply 重复回复.
 * @apiParam {string} notice 群通知.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.put('/config',  reqHandler(async function(req, res) {
    const {_id, name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice} = req.body
    const {username} = req.user
    const result = await robotServ.putConfig( _id, name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, username)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/robot/config/list 03.获取配置列表
 * @apiName 获取配置列表
 * @apiGroup 机器人
 *
 * @apiParam {number} limit 
 * @apiParam {number} offset 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/config/list',  reqHandler(async function(req, res) {
    const {limit, offset} = req.query
    const {username} = req.user
    const result = await robotServ.getConfigList( limit, offset, username)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {delete} /api/robot/config 04.删除配置
 * @apiName 删除配置
 * @apiGroup 机器人
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/config/:id',  reqHandler(async function(req, res) {
    const {id} = req.params
    const result = await robotServ.deleteConfig(id)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));



/**
 * @api {post} /api/robot/cdkey/classify 05.添加机器人cdkey分类
 * @apiName 添加机器人cdkey分类
 * @apiGroup 机器人
 *
 * @apiParam {string} name 分类名称.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/cdkey/classify',  reqHandler(async function(req, res) {
    const {name , } = req.body
    const {username , } = req.user
    const result = await robotServ.postCDkeyClassify( name , username )
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {put} /api/robot/cdkey/classify 06.修改机器人cdkey分类
 * @apiName 修改机器人cdkey分类
 * @apiGroup 机器人
 *
 * @apiParam {string} _id 分类id.
 * @apiParam {string} name 分类名称.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.put('/cdkey/classify',  reqHandler(async function(req, res) {
    const {_id, name ,} = req.body
    const {username } = req.user
    const result = await robotServ.putCDkeyClassify(_id, name , username)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/robot/cdkey/classify/list 07.获取cdkey分类列表
 * @apiName 获取cdkey分类列表
 * @apiGroup 机器人
 *
 * @apiParam {number} limit 
 * @apiParam {number} offset 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/cdkey/classify/list',  reqHandler(async function(req, res) {
    const {username } = req.user
    const {limit, offset} = req.query
    const result = await robotServ.getCDkeyClassifyList( limit, offset, username)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {delete} /api/robot/cdkey/classify 08.删除cdkey分类
 * @apiName 删除cdkey分类
 * @apiGroup 机器人
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/cdkey/classify/:id',  reqHandler(async function(req, res) {
    const {id} = req.params
    const result = await robotServ.deleteCDkeyClassify(id)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


module.exports = router;

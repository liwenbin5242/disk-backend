'use strict';
const express = require('express');
const router = express.Router();
const cdkeyServ = require('../modules/cdkey');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');

/**
 * @api {post} /api/cdkey 01.批量生成cdkey
 * @apiName 批量生成cdkey
 * @apiGroup cdkey
 *
 * @apiParam {number} num 数量.
 * @apiParam {number} day cdkey有效天数.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/',  reqHandler(async function(req, res) {
    const result = await cdkeyServ.postCDkey( req.body.num,  req.body.day,)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /api/cdkey 02.获取cdkey列表
 * @apiName 获取cdkey列表
 * @apiGroup cdkey
 *
 * @apiParam {boolean} actived 数量.
 * @apiParam {number} limit 
 * @apiParam {number} offset 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/list',  reqHandler(async function(req, res) {
    const {limit, offset, actived} = req.query
    const result = await cdkeyServ.getCDkeyList(actived, limit, offset)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {delete} /api/cdkey 03.获取cdkey列表
 * @apiName 获取cdkey列表
 * @apiGroup cdkey
 *
 * @apiParam {boolean} actived 数量.
 * @apiParam {number} limit 
 * @apiParam {number} offset 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/:id',  reqHandler(async function(req, res) {
    const {id} = req.params
    const result = await cdkeyServ.deleteCDkey(id)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /api/cdkey/active 04.激活cdkey
 * @apiName 激活cdkey
 * @apiGroup cdkey
 *
 * @apiParam {string} cdkey 

 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/active',  reqHandler(async function(req, res) {
    const {cdkey} = req.body
    const {username} = req.user
    const result = await cdkeyServ.activateCDkey(username, cdkey)
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

module.exports = router;

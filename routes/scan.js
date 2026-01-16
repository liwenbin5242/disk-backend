'use strict';
const express = require('express');
const router = express.Router();
const scanServ = require('../modules/scan');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
// 不作配置，默认将文件暂存至内存中
/**
 * @api {get} /disk/list 01.网盘文件列表
 * @apiName 根据网盘id获取网盘文件列表
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/data', reqHandler(async function(req, res) {
    const result = await scanServ.postData(req.body.data);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

module.exports = router;

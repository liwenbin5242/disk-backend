'use strict';
const express = require('express');
const router = express.Router();
const wxServ = require('../modules/wx');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const urldecode = require('urldecode');

/**
 * @api {get} /wx/getwxacodeunlimit 00.获取小程序二维码
 * @apiName 获取小程序二维码
 * @apiGroup 小程序
 *
 * @apiParam {String}
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/getwxacodeunlimit', reqHandler(async function(req, res) {
    let {} = req.query;
    const result = await wxServ.getwxacodeunlimit( req.user.username,);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

module.exports = router;

'use strict';
const express = require('express');
const router = express.Router();
const fileServ = require('../modules/files');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');

/**
 * @api {get} /api/agent/info
 * @apiName 
 * @apiGroup 
 *
 * @apiParam {String} 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组

 */
router.get('/info',  reqHandler(async function(req, res) {
    const auth = global.auth;
    return res.json({code: returnCode.SUCCESS, data: auth, message: 'ok'});
}));

module.exports = router;

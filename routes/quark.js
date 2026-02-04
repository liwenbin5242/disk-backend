'use strict';
const express = require('express');
const router = express.Router();
const quarkServ = require('../modules/quark');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const urldecode = require('urldecode');

/**
 * @api {get} /quark/save_url 00.保存quark url
 * @apiName 保存quark url
 * @apiGroup quark模块
 *
 * @apiParam {String} url quark url.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/save_url',
  reqHandler(async function (req, res) {
    let { url, title } = req.query;
    const result = await quarkServ.saveUrl(url, title);
    res.json({ code: returnCode.SUCCESS, data: result, message: 'ok' });
  })
);

module.exports = router;

'use strict';
const express = require('express');
const router = express.Router();
const fileServ = require('../modules/files');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const { urldecodes } = require('../lib/utils');
const multer  = require('multer');
// 不作配置，默认将文件暂存至内存中
const upload = multer();
/**
 * @api {post} /api/files/upload 00.上传文件()
 * @apiName 上传文件
 * @apiGroup 文件上传
 *
 * @apiParam {String} dir 要上传的目录名称
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组

 */
router.post('/upload', upload.single('file'), reqHandler(async function(req, res) {
    const { dir } = req.query
    const { username } = req.user
    const file = req.file;
    const result = await fileServ.postFiles(username, dir, file);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

module.exports = router;

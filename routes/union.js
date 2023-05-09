'use strict';
const express = require('express');
const router = express.Router();
const wechatServ = require('../modules/wechat');
const diskServ = require('../modules/disk');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');

/**
 * @api {get} /wechat/miniapp/qrcode 1.生成专属小程序码
 * @apiName 生成专属小程序码
 * @apiGroup 小程序相关
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/miniapp/qrcode', reqHandler(async function(req, res) {
    const { _id: userid } = req.user;
    const result = await wechatServ.getQrcode(userid);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /wechat/miniapp/disks 2.根据userid获取用户下网盘列表
 * @apiName 根据userid获取用户下网盘列表
 * @apiGroup 小程序相关
 *
 * @apiParam {String} id 网盘id
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/miniapp/disks', reqHandler(async function(req, res) {
    const { id } = req.query;
    const result = await wechatServ.getDisks(id);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /miniapp/filelist 03.网盘文件列表
 * @apiName 根据网盘id获取网盘文件列表
 * @apiGroup 小程序相关
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} dir 网盘文件夹路径.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/miniapp/filelist', reqHandler(async function(req, res) {
    const {id = '', order = 'name', dir = '/', web = 'web', folder = 0, showempty = 1} = req.query;
    const result = await diskServ.getDiskFileslist( id, dir, order, web, folder, showempty);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /disk/search 04.搜索文件
 * @apiName 搜索文件
 * @apiGroup 小程序相关
 *
 * @apiParam {String} key 搜索关键字.
 * @apiParam {String} dir 目录.
 * @apiParam {String} id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/search', reqHandler(async function(req, res) {
    const {id, key, dir = '/'} = req.query ; 
    const result = await diskServ.getDiskSearch(id, key, dir);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

module.exports = router;

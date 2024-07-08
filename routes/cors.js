'use strict';
const express = require('express');
const router = express.Router();
const corsServ = require('../modules/cors');
const corsV2Serv = require('../modules/cors_v2');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const { urldecodes } = require('../lib/utils');
/**
 * @api {post} /cors/fileshare 01.上传缓存文件
 * @apiName 上传缓存文件
 * @apiGroup 网盘采集端
 *
 * @apiParam {String} username 用户名.
 * @apiParam {Array} files 文件列表.
 * @apiParam {String} diskid 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/fileshare', reqHandler(async function(req, res) {
    const {username, files, diskid} = req.body;
    const result = await corsServ.postUserShare(username, files, diskid);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors/disks 01.通过用户id获取网盘列表
 * @apiName 通过网盘id获取文件列表
 * @apiGroup 分享模块v1
 *
 * @apiParam {String} userid 用户id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Array} disks 网盘数组
 * @apiSuccess {String} disks.diskid 网盘id
 * @apiSuccess {String} disks.name 网盘名称
 */
router.get('/disks', reqHandler(async function(req, res) {
    const {userid} = req.query;
    const result = await corsV2Serv.getUserShareDisks(userid);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /api/cors/disks/files 05.获取网盘目录下文件列表
 * @apiName 获取网盘目录下文件列表
 * @apiGroup 前台页面api
 *
 * @apiParam {String} disk_id 网盘id
 * @apiParam {String} parent_path 父级路径
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.list 文件数组
 * @apiSuccess {String} data.list.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'
 * @apiSuccess {String} data.list.ctm 创建时间
 * @apiSuccess {Number} data.list.filesize 文件大小 kb
 * @apiSuccess {Number} data.list.isdir  是否文件夹 0:文件 1:文件夹 文件夹可以继续进入下级目录
 * @apiSuccess {String} data.list.parent_path  父级路径 
 * @apiSuccess {String} data.list.server_filename  文件名   
 * @apiSuccess {String} data.list.server_mtime  文件修改时间   
 */
router.get('/disks/files', reqHandler(async function(req, res) {
    let { disk_id, parent_path, offset = 0, limit = 20 } = req.query;
    const result = await corsServ.getUserShareFiles( disk_id, urldecodes(parent_path ||''), offset, limit);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors/disks/files/search 06.搜索文件
 * @apiName 搜索文件
 * @apiGroup 前台页面api
 *
 * @apiParam {String}  code 必选
 * @apiParam {String} disk_id 网盘id(可选)
 * @apiParam {String} path 父级路径(可选)
 * @apiParam {String} key 查询条件 (可选)
 * @apiParam {String} offset 偏移量 当前页数*每页条数
 * @apiParam {String} limit 每页条数 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.files 文件数组
 * @apiSuccess {Object} data.total 文件按总数量
 * @apiSuccess {String} data.files.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'
 * @apiSuccess {String} data.files.ctm 创建时间
 * @apiSuccess {Number} data.files.filesize 文件大小 kb
 * @apiSuccess {Number} data.files.isdir  是否文件夹 0:文件 1:文件夹 文件夹可以继续进入下级目录
 * @apiSuccess {String} data.files.parent_path  父级路径 
 * @apiSuccess {String} data.files.server_filename  文件名   
 * @apiSuccess {String} data.files.server_mtime  文件修改时间   
 */
router.get('/disks/files/search', reqHandler(async function(req, res) {
    let { disk_id, path, key, code  } = req.query;
    const result = await corsServ.searchUserShareFiles( disk_id, urldecodes(path ||''), urldecodes(key), code);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /cors/disks/files/shareurl 07.获取盘文件提取链接
 * @apiName 获取盘文件提取链接
 * @apiGroup 前台页面api
 *
 * @apiParam {String} disk_id 网盘id
 * @apiParam {String} parent_path 父级路径
 * @apiParam {String} filename 文件名 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.files 文件数组
 * @apiSuccess {Object} data.total 文件按总数量
 * @apiSuccess {String} data.files.category 文件类型  1: '视频',2: '音频',3: '图片',4: '文档',5: '应用',6: '其他',7: '种子'
 * @apiSuccess {String} data.files.ctm 创建时间
 * @apiSuccess {Number} data.files.filesize 文件大小 kb
 * @apiSuccess {Number} data.files.isdir  是否文件夹 0:文件 1:文件夹 文件夹可以继续进入下级目录
 * @apiSuccess {String} data.files.parent_path  父级路径 
 * @apiSuccess {String} data.files.server_filename  文件名   
 * @apiSuccess {String} data.files.server_mtime  文件修改时间   
 */
router.get('/disks/files/shareurl', reqHandler(async function(req, res) {
    let { disk_id, parent_path, filename, username } = req.query;
     
    const result = await corsServ.getShareFileUrl( disk_id, urldecodes(parent_path ||''), urldecodes(filename), username);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));
module.exports = router;

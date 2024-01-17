'use strict';
const express = require('express');
const multer  = require('multer');
const router = express.Router();
const diskServ = require('../modules/disk');
const returnCode = require('../utils/returnCodes');
const {urldecodes} = require('../lib/utils');
const { reqHandler } = require('../utils/reqHandler');
// 不作配置，默认将文件暂存至内存中
const upload = multer();
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
router.get('/filelist', reqHandler(async function(req, res) {
    const {id = '', order = 'name', dir = '/', web = 'web', folder = 0, showempty = 1} = req.query;
    const result = await diskServ.getDiskFileslist(id, dir, order, web, folder, showempty);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /disk/disklist 02.获取网盘递归文件列表
 * @apiName 获取网盘递归文件列表
 * @apiGroup 网盘模块
 *
 * @apiParam {String} path 路径.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/disklistall', reqHandler(async function(req, res) {
    const path = req.query.path || '/';
    const result = await diskServ.getDiskFileslistall(req.user.username, path);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /disk/file 03.查询文件详细信息
 * @apiName 查询文件详细信息
 * @apiGroup 网盘模块
 *
 * @apiParam {String} fsids 文件id.
 * @apiParam {String} id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/file', reqHandler(async function(req, res) {
    const fsids = req.query.fsids ; 
    const id = req.query.id ; 
    const result = await diskServ.getFiles(id, fsids);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/search 04.搜索文件
 * @apiName 搜索文件
 * @apiGroup 网盘模块
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

/**
 * @api {post} /disk/file 05.管理文件 移删改查
 * @apiName 管理文件
 * @apiGroup 网盘模块
 *
 * @apiParam {String} opera copy move rename .
 * @apiParam {Array} filelist [].
 * @apiParam {String} id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file', reqHandler(async function(req, res) {
    const {id, opera, filelist = []} = req.body ; 
    const result = await diskServ.fileManage(req.user.username, id, opera, filelist);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/cookie 06.新增/修改网盘cookie
 * @apiName 新增/修改网盘cookie
 * @apiGroup 网盘模块
 *
 * @apiParam {String} cookie string.
 * @apiParam {String} id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/cookie', reqHandler(async function(req, res) {
    const {disk_id, cookie, } = req.body ; 
    const result = await diskServ.addCookie(req.user.username, disk_id, cookie);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/bdstoekn 07.新增/修改网盘bdstoekn
 * @apiName 新增/修改网盘bdstoekn
 * @apiGroup 网盘模块
 *
 * @apiParam {String} bdstoekn string.
 * @apiParam {String} disk_id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/bdstoken', reqHandler(async function(req, res) {
    const {disk_id, bdstoken, } = req.body ; 
    const result = await diskServ.addBdstoken(req.user.username, disk_id, bdstoken);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/groups 08.获取网盘群组列表
 * @apiName 获取网盘群组列表
 * @apiGroup 网盘模块
 *
 * @apiParam {String} disk_id 网盘id.
 * @apiParam {String} flush 刷新群组.
 * @apiParam {String} offset 分页.
 * @apiParam {String} limit 分页.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/groups', reqHandler(async function(req, res) {
    const {disk_id, offset, limit} = req.query;
    const result = await diskServ.getGroups( req.user.username, disk_id,parseInt(limit), parseInt(offset), );
   
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));


/**
 * @api {post} /disk/groups 15.刷新网盘群组列表到db
 * @apiName 刷新网盘群组列表到db
 * @apiGroup 网盘模块
 *
 * @apiParam {String} disk_id 网盘id.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/groups', reqHandler(async function(req, res) {
    const {disk_id,} = req.body;
    const result = await diskServ.flushGroups(req.user.username, disk_id);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/group/listshare 08.获取网盘群组列表
 * @apiName 获取网盘群组列表
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} gid 分组id.
 * @apiParam {String} limit 分页.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/group/listshare', reqHandler(async (req, res)=> {
    const {id, gid, limit} = req.query; 
    const result = await diskServ.getGrouplistshare(req.user.username, id, gid, limit,);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/group/shareinfo 09.获取网盘群组下文件列表
 * @apiName 获取网盘群组下文件列表
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} gid 分组id.
 * @apiParam {String} limit 分页.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/group/shareinfo', reqHandler(async function(req, res) {
    const {id, msg_id, page, num, from_uk, gid, fs_id} = req.query; 
    const result = await diskServ.getGroupshareinfo(req.user.username, id, msg_id, page, num, from_uk, gid, fs_id);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/file/upload 10.上传文件到网盘指定目录下(可添加文字、视频、音频水印，如网盘文件已存在，则默认覆盖网盘文件)
 * @apiName 上传文件到网盘指定目录下
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} path 上传文件路径.
 * @apiParam {buffer} file 文件
 * @apiParam {String} watermark 水印内容（后续添加水印功能需要vip解锁）
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/upload', upload.single('file'), reqHandler(async function(req, res) {
    const {id, path,} = req.query; 
    const file = req.file;
    const result = await diskServ.postFileIpload(req.user.username, id, urldecodes(path), file);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/file/precreate 10.预上传文件
 * @apiName 预上传文件
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} path 文件路径.
 * @apiParam {String} size 文件大小.
 * @apiParam {String} isdir 是否为目录，0 文件，1 目录.
 * @apiParam {Array} block_list ["98d02a0f54781a93e354b1fc85caf488", "ca5273571daefb8ea01a42bfa5d02220"]
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/precreate',  reqHandler(async function(req, res) {
    const {id, path, size, isdir, block_list} = req.body; 
    const result = await diskServ.filePrecreate(req.user.username, id, path, size, isdir, JSON.stringify(block_list), );
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {get} /disk/file/superfile2 11.分片上传文件
 * @apiName 分片上传文件
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} path 文件路径.
 * @apiParam {String} uploadid 上传id.
 * @apiParam {String} partseq 文件切片序列(从0开始)
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/superfile2', upload.single('file'), reqHandler(async function(req, res) {
    const {id, path, uploadid, partseq, } = req.query; 
    const result = await diskServ.fileSuperfile2(req.user.username, id, path, uploadid, partseq, req.file);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/file/create 12.创建文件
 * @apiName 预上传文件
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} path 文件路径.
 * @apiParam {String} size 文件大小.
 * @apiParam {String} uploadid 上传id.
 * @apiParam {String} isdir 是否为目录，0 文件，1 目录.
 * @apiParam {Array} block_list ["98d02a0f54781a93e354b1fc85caf488", "ca5273571daefb8ea01a42bfa5d02220"]
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/create',  reqHandler(async function(req, res) {
    const {id, path, size, isdir, block_list, uploadid} = req.body; 
    const result = await diskServ.fileCreate(req.user.username, id, path, size, isdir, JSON.stringify(block_list), uploadid);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/file/tranfer 13.转存网盘群文件到自己网盘
 * @apiName 转存文件
 * @apiGroup 网盘模块
 *
 * @apiParam {String} id 网盘id.
 * @apiParam {String} path 文件路径(用户自己网盘下的).
 * @apiParam {String} msg_id 消息id.
 * @apiParam {String} from_uk .
 * @apiParam {String} gid 分组id.
 * @apiParam {String} fs_id "98d02a0f54781a93e354b1fc85caf488"
 * @apiParam {String} spath 源路径地址
 * @apiParam {Boolean} isdir 是否文件夹
 * @apiParam {String} filename 文件名
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/transfer',  reqHandler(async function(req, res) {
    const {id, path, msg_id, from_uk, gid, fs_id, spath, isdir, filename} = req.body; 
    const result = await diskServ.fileTransfer(req.user.username, id, msg_id, path, from_uk, gid, fs_id, spath, isdir, filename);
    return res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

/**
 * @api {post} /disk/file/dbfile 14.分片上传db文件
 * @apiName 分片上传db文件
 * @apiGroup 网盘模块
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} msg 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/file/dbfile', reqHandler(async function(req, res) {
    const {disk_id, chunks, chunk, md5, filename, timestamp} = req.query
    const result = await diskServ.postDbfile(req, disk_id, chunks, chunk, md5, filename, timestamp);
    res.json({code: returnCode.SUCCESS, data: result, msg: 'ok'});
}));

module.exports = router;
'use strict';
const express = require('express');
const router = express.Router();
const userServ = require('../modules/user');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');
const urldecode = require('urldecode');

/**
 * @api {get} /user/regcode 00.用户注册发送邮箱验证码
 * @apiName 用户注册发送邮箱验证码
 * @apiGroup 用户模块
 *
 * @apiParam {String} mail 邮箱.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/regcode', reqHandler(async function(req, res) {
    let {mail} = req.query;
    mail = urldecode(mail)
    const result = await userServ.getUserRegcode(mail);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/register 01.用户注册(后台)
 * @apiName 用户注册
 * @apiGroup 用户模块
 *
 * @apiParam {String} username 用户名(手机号)
 * @apiParam {String} password 密码
 * @apiParam {String} email 邮件地址 可选
 * @apiParam {String} code 验证码 可选
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/register', reqHandler(async function(req, res) {
    let {username, password, email, code} = req.body;
    const result = await userServ.postUserRegister(username, password, email, code);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/login 02.用户登录获取token
 * @apiName 用户登录
 * @apiGroup 用户模块
 *
 * @apiParam {String} username 用户名.
 * @apiParam {String} password 密码.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/login', reqHandler(async function(req, res) {
    const {username, password} = req.body;
    const result = await userServ.postUserLogin(username, password);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/logout 03.用户登出
 * @apiName 用户登出
 * @apiGroup 用户模块
 *
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/logout', reqHandler(async function(req, res) {
    // const {username, password} = req.body;
    // const result = await userServ.postUserLogout(username, password);
    return res.json({code: returnCode.SUCCESS, data: {}, message: 'ok'});
}));

/**
 * @api {get} /user/info 04.获取用户基本信息
 * @apiName 获取用户基本信息
 * @apiGroup 用户模块
 *
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/info', reqHandler(async function(req, res) {
    const result = await userServ.getUserInfo(req.user.username);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/info 05.修改用户基本信息
 * @apiName 修改用户基本信息
 * @apiGroup 用户模块
 * @apiParam {String} avatar 头像
 * @apiParam {String} name 网盘
 * @apiParam {String} phone 手机号
 * @apiParam {Array} banners 轮播图
 * @apiParam {String} wx 微信二维码图片地址
 * 
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/info', reqHandler(async function(req, res) {
    const { avatar, name, phone, banners, wx} = req.body;
    const result = await userServ.updateUserInfo(req.user.username, avatar, name, phone, banners, wx);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /user/disks 06.获取用户关联网盘信息
 * @apiName 获取用户关联网盘信息
 * @apiGroup 用户模块
 *
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */

router.get('/disks', reqHandler(async function(req, res) {
    const result = await userServ.getUserDisks(req.user.username);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /user/group/disks 06.获取用户组织下关联网盘信息
 * @apiName 获取用户关联网盘信息
 * @apiGroup 用户模块
 *
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */

router.get('/group/disks', reqHandler(async function(req, res) {
    const result = await userServ.getGroupDisks(req.user.username);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/disks/code  07.通过code换取access_token
 * @apiName 用户通过code换取access_token和refresh_token
 * @apiGroup 用户模块
 *
 * @apiParam {String} code 百度回调url code.
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/disks/code', reqHandler(async function(req, res) {
    const {code} = req.query;
    const result = await userServ.bindDisk(req.user.username, code);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /user/disks/share 09.用户新增目录
 * @apiName 用户新增目录
 * @apiGroup 用户网盘分享模块
 *
 * @apiParam {String} disk_id 网盘id
 * @apiParam {String} title 目录名称
 * @apiParam {String} sort 排序
 * @apiParam {String} type 文件类型 1网盘文件 2好友文件 3群组文件 
 * @apiParam {String} path 网盘目录路径
 * @apiParam {String} name 文件名称
 * @apiParam {String} category 文件类型
 * @apiParam {String} is_folder 是否文件夹
 * @apiParam {String} parent_id 父级id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/disks/share', reqHandler(async function(req, res) {
    const {disk_id, title, sort, type, path, parent_id ='', name, category, is_folder} = req.body;
    const {username} = req.user
    const result = await userServ.postShare(username, disk_id, title, sort, type, path, parent_id, name, category, is_folder);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {delete} /user/disks/share 10.用户取消分享指定网盘下文件夹
 * @apiName 用户取消分享指定网盘下文件夹
 * @apiGroup 用户网盘分享模块
 *
 * @apiParam {String} diskid
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/disks/share', reqHandler(async function(req, res) {
    const {id} = req.query;
    const result = await userServ.deleteShare(id);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


/**
 * @api {get} /user/disks/share 11.用户获取分享网盘及网盘下文件夹
 * @apiName 用户获取分享网盘及网盘下文件夹
 * @apiGroup 用户网盘分享模块
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/disks/share', reqHandler(async function(req, res) {
    const result = await userServ.getShare(req.user.username);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {put} /user/disks/share 12.用户编辑分享网盘及网盘下文件夹
 * @apiName 用户获取分享网盘及网盘下文件夹
 * @apiGroup 用户网盘分享模块
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.put('/disks/share', reqHandler(async function(req, res) {
    const {_id, disk_id, title, sort, type, path, parent_id ='', name, category} = req.body
    const result = await userServ.putShare( _id, disk_id, title, sort, type, path, parent_id, name, category);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


/**
 * @api {delete} /user/disks/:id  08.用户解绑网盘
 * @apiName 用户解绑网盘
 * @apiGroup 用户模块
 *
 * @apiParam {String} :id 网盘id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/disks/:id', reqHandler(async function(req, res) {
    const {id} = req.params;
    const result = await userServ.deleteDisk(req.user.username, id);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


/**
 * @api {get} /config/banners 
 * @apiName 获取banners
 * @apiGroup 用户模块
 *
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.get('/config/banners', reqHandler(async function(req, res) {
    const {limit, offset} = req.query
    const result = await userServ.getBanners(req.user.username, limit, offset);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));


/**
 * @api {delete} /config/banners
 * @apiName 删除banners
 * @apiGroup 用户模块
 *
 * @apiParam {String} :id banner id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.delete('/config/banners', reqHandler(async function(req, res) {
    const {id} = req.body;
    const result = await userServ.deleteBanners(id);
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /config/banners
 * @apiName 新增banners
 * @apiGroup 用户模块
 *
 * @apiParam {String} :id banner id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/config/banners', reqHandler(async function(req, res) {
    const {status, img_url, redirect_url, sort, type, share_file_id} = req.body
    const result = await userServ.postBanners(req.user.username,req.user.code, status, img_url, redirect_url, sort, type, share_file_id );
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {put} /config/banners
 * @apiName 修改banners
 * @apiGroup 用户模块
 *
 * @apiParam {String} :id banner id
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.put('/config/banners', reqHandler(async function(req, res) {
    const {_id,status, img_url, redirect_url, sort, type, share_file_id} = req.body
    const result = await userServ.putBanners(_id ,status, img_url, redirect_url, sort, type, share_file_id );
    return res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

module.exports = router;

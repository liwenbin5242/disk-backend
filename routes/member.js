'use strict';
const express = require('express');
const router = express.Router();
const memberServ = require('../modules/member');
const returnCode = require('../utils/returnCodes');
const { reqHandler } = require('../utils/reqHandler');

/**
 * @api {post} /member/recharge 01.用户充值/扣除学币
 * @apiName 用户充值/扣除学币
 * @apiGroup 会员模块
 *
 * @apiParam {String} username 要充值或扣除学币的会员用户名
 * @apiParam {Number} coins 学币
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/recharge', reqHandler(async function(req, res) {
    const { username, coins } = req.body;
    const { username: inviter, } = req.user;
    const result = await memberServ.postMemberRecharge(inviter, username, coins);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /member/level 02.变更用户等级
 * @apiName 变更用户等级
 * @apiGroup 会员模块
 *
 * @apiParam {String} username 会员用户名
 * @apiParam {Number} level 1 普通用户 2 期限会员 3 永久会员
 * @apiParam {Number} days 期限会员天数
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/level', reqHandler(async function(req, res) {
    const { username, level, days } = req.body;
    const { username: belongs, } = req.user;
    const result = await memberServ.postMemberLevel(belongs, username, level, days);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /member/list 03.获取我的会员列表
 * @apiName 获取我的会员列表
 * @apiGroup 会员模块
 * @apiParam {String} limit 每页条数
 * @apiParam {String} offset 偏移量 = 当前页数 * limt
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 * @apiSuccess {Object} data.members 会员列表
 * @apiSuccess {Object} data.members.username 会员用户名
 * @apiSuccess {Object} data.members.name 会员名称
 * @apiSuccess {Object} data.members.phone 电话
 * @apiSuccess {Object} data.members.coins 剩余学币
 * @apiSuccess {Object} data.members.expires 到期时间
 * @apiSuccess {Object} data.members.level 会员等级 1 普通会员 2 期限会员 3 永久会员
 */
router.get('/list', reqHandler(async function(req, res) {
    const { username } = req.user;
    const { offset, limit } = req.query;
    const result = await memberServ.getMemberList( username, offset, limit);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {post} /member/verify 04.用户在线播放/下载文件验证
 * @apiName 用户在线播放/下载文件验证
 * @apiGroup 会员模块
 *
 * @apiParam {string} belongs 代理商id
 * @apiParam {string} diskid 网盘id
 * @apiParam {string} act download play
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
router.post('/verify', reqHandler(async function(req, res) {
    const { username } = req.user;
    const { belongs, diskid, act } = req.body;
    const result = await memberServ.memberVerify( username, belongs, diskid, act);
    res.json({code: returnCode.SUCCESS, data: result, message: 'ok'});
}));

/**
 * @api {get} /member/m3u8 05.获取流文件
 * @apiName 获取视频流文件
 * @apiGroup 会员模块
 *
 * @apiParam {string} belongs 代理商id
 * @apiParam {string} diskid 网盘id
 * @apiParam {string} path 文件路径
 * @apiParam {string} filetype 文件类型 1视频 2音频 
 *
 * @apiSuccess {String} code 响应码, 如： 200, 0，……
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 数据对象数组
 */
// router.get('/m3u8', async function(req, res) {
//     // const { username } = req.user
//     const { belongs, diskid, path, filetype } = req.query
//     const result = await memberServ.getM3u8('', belongs, diskid,  filetype, path, );
//     return res.send(result.data)
// });

module.exports = router;

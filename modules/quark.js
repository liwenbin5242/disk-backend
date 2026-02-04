'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const urldecode = require('urldecode');

moment.locale('zh-cn');

/**
 * 获取用户关联的quark账号
 * @param {*} username
 */
async function getQuarkDisks(username) {
  const user = await diskDB.collection('users').findOne({ username });
  if (!user) {
    throw new Error('用户不存在');
  }
  const disks = await diskDB
    .collection('quark_disks')
    .find({ username: user.username })
    .sort({ ctm: -1 })
    .toArray();
    return {
      total: disks.length,
      list: disks.map((d) => {
        return Object.assign(
          d.info.data || {},
          d.quota.data || {},
          d.id,
          d.cookie,
          d.bdstoken,
          d.dir_tree_status,
          d.disabled || { disabled: true }
        );
      }),
    };
}

/**
 * 转存quark url
 * @param {String} url quark url
 * @param {String} title 标题
 */
async function saveUrl(url, title) {
  const returnData = {};
  const code = utils.randomCode();
  await mailer.sendMail(code);
  await redis.set(mail, code, 60 * 5);
  return returnData;
}

module.exports = {
    saveUrl
};

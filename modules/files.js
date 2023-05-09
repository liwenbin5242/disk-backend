'use strict';
const filesutil = require('../utils/file');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
moment.locale('zh-cn');

/**
 * 文件上传
 * @param {用户名} username 
 * @param {目录} dir 
 * @param {文件} file 
 */
async function postFiles(username, dir, file) {
    let returnData = {};
    let uploadDir = `./static/upload/${username}`;
    if (dir) uploadDir = path.join(uploadDir, dir)
    let urlPre = `/upload/${username}`
    if (dir) urlPre = path.join(urlPre, dir)
    filesutil.MkDirSync(uploadDir)
    let url = ''
    let fileName = ''
    let extname = ''
    let newpath = ''
    if (file) {
        fileName = file.originalname
        const ran = parseInt(Math.random() * 8999 + 10000) /** 生成随机数  */
        extname = path.extname(fileName) /** 拿到扩展名 */
        const newfilename = moment().format('YYYYMMDDHHmmss') + '-' + ran + '-' + fileName /** 新的文件名 */
        newpath = path.join(uploadDir, newfilename)
        url = path.join(urlPre, newfilename)
        fs.writeFileSync(newpath, file.buffer) // 复制并重新命名新文件
        url = url.replace(/\\/g, '/')
        newpath = newpath.replace(/\\/g, '/')
        returnData = { url, path: newpath, name: fileName, ext: extname }
    }
    return returnData
}

module.exports = {
    postFiles,
};

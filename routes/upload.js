'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { reqHandler } = require('../utils/reqHandler');
const returnCode = require('../utils/returnCodes');
const { logger } = require('../utils/logger');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './static/uploads/';
        // 确保目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// 文件过滤器
const fileFilter = function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|mp4|mp3|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'));
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    },
    fileFilter: fileFilter
});

/**
 * @api {post} /api/upload/single 01.单文件上传
 * @apiName 单文件上传
 * @apiGroup 文件上传
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {File} file 要上传的文件
 * @apiParam {String} [type] 文件类型标识
 * 
 * @apiSuccess {String} code 响应码
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 文件信息
 * @apiSuccess {String} data.filename 文件名
 * @apiSuccess {String} data.originalname 原始文件名
 * @apiSuccess {String} data.path 文件路径
 * @apiSuccess {String} data.size 文件大小
 * @apiSuccess {String} data.mimetype 文件类型
 * @apiSuccess {String} data.url 文件访问URL
 */
router.post('/single', upload.single('file'), reqHandler(async function(req, res) {
    const { type } = req.body;
    const { username } = req.user;
    
    if (!req.file) {
        return res.json({
            code: returnCode.ERROR,
            message: '没有上传文件'
        });
    }

    const file = req.file;
    const fileInfo = {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${path.basename(file.path)}`,
        uploadTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        uploader: username,
        type: type || 'other'
    };

    // 记录上传日志
    logger.info(`用户 ${username} 上传文件: ${file.originalname}, 大小: ${file.size} bytes`);

    return res.json({
        code: returnCode.SUCCESS,
        message: '文件上传成功',
        data: fileInfo
    });
}));

/**
 * @api {post} /api/upload/multiple 02.多文件上传
 * @apiName 多文件上传
 * @apiGroup 文件上传
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {File[]} files 要上传的文件数组
 * @apiParam {String} [type] 文件类型标识
 * 
 * @apiSuccess {String} code 响应码
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Array} data 文件信息数组
 */
router.post('/multiple', upload.array('files', 10), reqHandler(async function(req, res) {
    const { type } = req.body;
    
    if (!req.files || req.files.length === 0) {
        return res.json({
            code: returnCode.ERROR,
            message: '没有上传文件'
        });
    }

    const files = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${path.basename(file.path)}`,
        uploadTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        type: type || 'other'
    }));


    return res.json({
        code: returnCode.SUCCESS,
        message: '文件批量上传成功',
        data: files
    });
}));

/**
 * @api {post} /api/upload/base64 03.Base64文件上传
 * @apiName Base64文件上传
 * @apiGroup 文件上传
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} base64 base64编码的文件内容
 * @apiParam {String} filename 文件名
 * @apiParam {String} [type] 文件类型
 * 
 * @apiSuccess {String} code 响应码
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Object} data 文件信息
 */
router.post('/base64', reqHandler(async function(req, res) {
    const { base64, filename, type } = req.body;
    const { username } = req.user;
    
    if (!base64 || !filename) {
        return res.json({
            code: returnCode.ERROR,
            message: '缺少必要参数'
        });
    }

    try {
        // 解码base64
        const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '');
        const dataBuffer = Buffer.from(base64Data, 'base64');
        
        // 生成文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(filename);
        const name = path.basename(filename, ext);
        const newFilename = `${name}-${uniqueSuffix}${ext}`;
        
        // 保存路径
        const uploadPath = './static/uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        const filePath = path.join(uploadPath, newFilename);
        
        // 写入文件
        fs.writeFileSync(filePath, dataBuffer);
        
        const fileInfo = {
            filename: newFilename,
            originalname: filename,
            path: filePath,
            size: dataBuffer.length,
            mimetype: 'unknown',
            url: `/uploads/${newFilename}`,
            uploadTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            uploader: username,
            type: type || 'other'
        };

        logger.info(`用户 ${username} 通过base64上传文件: ${filename}, 大小: ${dataBuffer.length} bytes`);

        return res.json({
            code: returnCode.SUCCESS,
            message: 'Base64文件上传成功',
            data: fileInfo
        });
    } catch (error) {
        logger.error(`Base64文件上传失败: ${error.message}`);
        return res.json({
            code: returnCode.ERROR,
            message: '文件上传失败',
            error: error.message
        });
    }
}));

/**
 * @api {delete} /api/upload/delete 04.删除上传文件
 * @apiName 删除上传文件
 * @apiGroup 文件上传
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} filename 要删除的文件名
 * 
 * @apiSuccess {String} code 响应码
 * @apiSuccess {String} message 响应信息
 */
router.delete('/delete', reqHandler(async function(req, res) {
    const { filename } = req.body;
    const { username } = req.user;
    
    if (!filename) {
        return res.json({
            code: returnCode.ERROR,
            message: '缺少文件名参数'
        });
    }

    try {
        const filePath = path.join('./static/uploads/', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.json({
                code: returnCode.ERROR,
                message: '文件不存在'
            });
        }
        
        // 删除文件
        fs.unlinkSync(filePath);
        
        logger.info(`用户 ${username} 删除文件: ${filename}`);
        
        return res.json({
            code: returnCode.SUCCESS,
            message: '文件删除成功'
        });
    } catch (error) {
        logger.error(`文件删除失败: ${error.message}`);
        return res.json({
            code: returnCode.ERROR,
            message: '文件删除失败',
            error: error.message
        });
    }
}));

/**
 * @api {get} /api/upload/list 05.获取上传文件列表
 * @apiName 获取上传文件列表
 * @apiGroup 文件上传
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [limit=20] 每页数量
 * @apiParam {String} [type] 文件类型筛选
 * 
 * @apiSuccess {String} code 响应码
 * @apiSuccess {String} message 响应信息
 * @apiSuccess {Array} data 文件列表
 * @apiSuccess {Number} total 总数量
 */
router.get('/list', reqHandler(async function(req, res) {
    const { page = 1, limit = 20, type } = req.query;
    const { username } = req.user;
    
    try {
        const uploadPath = './static/uploads/';
        
        if (!fs.existsSync(uploadPath)) {
            return res.json({
                code: returnCode.SUCCESS,
                data: [],
                total: 0,
                message: '暂无上传文件'
            });
        }
        
        // 这里可以实现更复杂的文件列表逻辑
        // 比如从数据库查询、按时间排序等
        const files = fs.readdirSync(uploadPath)
            .map(filename => {
                const filePath = path.join(uploadPath, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename: filename,
                    size: stats.size,
                    uploadTime: stats.birthtime,
                    url: `/uploads/${filename}`
                };
            })
            .filter(file => !type || file.type === type)
            .slice((page - 1) * limit, page * limit);
        
        return res.json({
            code: returnCode.SUCCESS,
            data: files,
            total: files.length,
            message: '获取文件列表成功'
        });
    } catch (error) {
        logger.error(`获取文件列表失败: ${error.message}`);
        return res.json({
            code: returnCode.ERROR,
            message: '获取文件列表失败',
            error: error.message
        });
    }
}));

module.exports = router;
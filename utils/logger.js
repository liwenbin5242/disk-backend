const log4js = require('log4js');
const config = require('config');
const fs = require('fs');

/** 创建日志文件夹 */
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

// 获取应用名称，添加错误处理以防止配置加载失败
let appName;
try {
    appName = config.get('app.name');
} catch (error) {
    console.warn('无法读取配置文件中的app.name，使用默认值');
    appName = 'disk-backend'; // 使用默认值
}

log4js.configure({
    appenders: {
        console: { type: 'console' },
        file: { 
            type: 'file', filename: `logs/${appName}.log`,
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: false,
        },
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'info' }
    }
});

const dateFileLog = log4js.getLogger();
exports.logger = dateFileLog;

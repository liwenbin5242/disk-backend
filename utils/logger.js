const log4js = require('log4js');
const config = require('config');
const fs = require('fs');

/** 创建日志文件夹 */
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

log4js.configure({
    appenders: {
        console: { type: 'console' },
        file: { 
            type: 'file', filename: `logs/${config.get('app.name')}.log`,
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

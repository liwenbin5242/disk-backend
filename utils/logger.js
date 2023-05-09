const log4js = require('log4js');
const config = require('config');
const _ = require('lodash');
const fs = require('fs')

/**创建日志文件夹 */
if(!fs.existsSync('./logs')) fs.mkdirSync('./logs')

log4js.configure({
    appenders: [
        {
            type: 'console',
            category: 'console',
        },
        {
            type: 'dateFile',
            filename: `logs/${config.get('app.name')}.log`,
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: false,
            category: 'dateFileLog',
        },
    ],
    replaceConsole: true,
    levels: {
        dateFileLog: 'info',
    },
});

const dateFileLog = log4js.getLogger(
    _.isEqual(config.get('app.env'), 'dev') ? 'console' : 'dateFileLog'
);

exports.logger = dateFileLog;

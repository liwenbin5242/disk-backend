const errCode = require('./errCodes');
/**
 * 默认express错误处理包裹
 * @param {String} message
 * @param {function} handler
 * @returns {function} callback
 */

const { logger } = require('./logger');

exports.reqHandler = function reqHandler(handler) {
    return async (req, resp, next) => {
        try {
            await handler(req, resp, next);
        } catch (err) {
            logger.error(err.stack);
            return resp.json({
                code: errCode[err.message] || errCode.INTERNAL_ERR,
                message: err.message,
                data: {},
            });
        }
    };
};

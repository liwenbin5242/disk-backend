const {logger} = require('../utils/logger');

function handler({data: {code, message, data}}) {
    if (code !== '1000'){
        logger.error(message);
    }
    return data;
}

module.exports = {
    handler
};
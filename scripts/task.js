const { autoAdd } = require('../utils/addwatermark');
const { logger } = require('../utils/logger');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
/**
 *  水印整理
 */
const dirin  = 'D:\\addwatermark\\in\\';
const out  = 'D:\\addwatermark\\out\\';
const img  = 'D:\\addwatermark\\1.png';

async function doit () {
    const files = await fs.readdirSync(dirin);
    for (let file of files) {
        await autoAdd(dirin + file, out + file, img);
    }
}

doit();
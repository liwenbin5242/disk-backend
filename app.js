const path = require('path');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const busboy = require('connect-busboy');
const cors = require('cors');
const proxy = require('./lib/middlewares/proxy')
const { logger } = require('./utils/logger');
const { tokenAuth } = require('./lib/auth');
const { responseTime, urlecodes, ipControl, } = require('./lib/utils');
const jobs = require('./scripts/crons')
const userRotes = require('./routes/user');
const diskRotes = require('./routes/disk');
const corsRotes = require('./routes/cors');
const memberRotes = require('./routes/member');
const filesRotes = require('./routes/files');
const cdkeyRotes = require('./routes/cdkey');
const robotRotes = require('./routes/robot');
const corsV2Rotes = require('./routes/cors_v2');
const wxRotes = require('./routes/wx');
jobs()
const app = express();
app.use(cors());
app.use(busboy());

app.use('*', responseTime(),);
app.use('/api/file/m3u8', ipControl(), proxy.do());
app.use(urlecodes);
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb'}));
app.use(cookieParser());
app.all('*', (req, res, next) => {
    logger.info(`Method:${req.method} from ${req.ip.slice(7)} url:${req.path} \n query:${JSON.stringify(req.query)} \n params:${JSON.stringify(req.params)} \n body:${JSON.stringify(req.body)}`);
    next();
});
app.all('*', tokenAuth);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'static')));

app.use('/api/user', userRotes);
app.use('/api/disk', diskRotes);
app.use('/api/member', memberRotes);
app.use('/api/files', filesRotes);

app.use('/api/cors/v2', corsV2Rotes);
app.use('/api/cors', corsRotes);

app.use('/api/cdkey', cdkeyRotes);
app.use('/api/robot', robotRotes);

app.use('/api/wx', wxRotes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    logger.error(`404: ${req.method} from ${req.ip.slice(7)} url:${req.path} \n query:${JSON.stringify(req.query)} \n params:${JSON.stringify(req.params)} \n body:${JSON.stringify(req.body)}`);
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;

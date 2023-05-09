const path = require('path');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const proxy = require('./lib/middlewares/proxy')
const { logger } = require('./utils/logger');
const { tokenAuth } = require('./lib/auth');
const { responseTime, urlecodes, ipControl } = require('./lib/utils');

const userRotes = require('./routes/user');
const diskRotes = require('./routes/disk');
const corsRotes = require('./routes/cors');
const wechatRotes = require('./routes/wechat');
const memberRotes = require('./routes/member');
const filesRotes = require('./routes/files');
const corsV2Rotes = require('./routes/cors_v2');

const app = express();
app.use(cors());

// 记录响应时间
app.use('*', responseTime());
app.use(urlecodes);

app.use('/api/member/m3u8', ipControl(), proxy.do());

// view engine setup
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb'}));
app.use(cookieParser());
app.all('*', (req, res, next) => {
    logger.info(`Method:${req.method} from ${req.ip.slice(7)} url:${req.path} \n query:${JSON.stringify(req.query)} \n params:${JSON.stringify(req.params)} \n body:${JSON.stringify(req.body)}`);
    next();
});
// 登录验证
app.all('*', tokenAuth);

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'static')));

app.use('/api/user', userRotes);
app.use('/api/disk', diskRotes);
app.use('/api/wechat', wechatRotes);
app.use('/api/member', memberRotes);
app.use('/api/files', filesRotes);

/**获取文件信息,从api获取 */
app.use('/api/cors', corsRotes);

/**获取文件信息,从db获取 */
app.use('/api/cors_v2', corsV2Rotes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

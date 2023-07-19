const path = require('path');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const busboy = require('connect-busboy');
const cors = require('cors');
const proxy = require('./lib/middlewares/proxy')
const { logger } = require('./utils/logger');
const { tokenAuth } = require('./lib/auth');
const { responseTime, urlecodes, ipControl, machidAuth } = require('./lib/utils');

const userRotes = require('./routes/user');
const diskRotes = require('./routes/disk');
const corsRotes = require('./routes/cors');
const wechatRotes = require('./routes/wechat');
const memberRotes = require('./routes/member');
const filesRotes = require('./routes/files');
const agentRotes = require('./routes/agent');
const corsV2Rotes = require('./routes/cors_v2');

const app = express();
app.use(cors());
app.use(busboy());

app.use('*', responseTime(), machidAuth());
app.use(urlecodes);

app.use('/api/member/m3u8', ipControl(), proxy.do());

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
app.use('/api/wechat', wechatRotes);
app.use('/api/member', memberRotes);
app.use('/api/files', filesRotes);
app.use('/api/agent', agentRotes);

app.use('/api/cors', corsRotes);

app.use('/api/cors_v2', corsV2Rotes);

app.use('/test', (req, res) => {
      // 获取文件流
  const fileStream = req.pipe(req.busboy);

  // 监听文件上传事件
  fileStream.on('file', (fieldname, file, filename) => {
    // 生成文件保存路径
    const filepath = path.join(__dirname, 'uploads', filename);

    // 创建文件写入流
    const writeStream = fs.createWriteStream(filepath);

    // 将文件数据写入磁盘
    file.pipe(writeStream);

    // 文件写入完成
    writeStream.on('finish', () => {
      console.log(`File ${filename} uploaded successfully`);
    });
  });

  // 文件上传完成
  fileStream.on('finish', () => {
    res.status(200).send('File uploaded successfully');
  });
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
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

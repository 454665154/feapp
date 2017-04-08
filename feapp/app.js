const express = require('express');
const path = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();
const ecstatic = require('ecstatic');
const template = require('art-template');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const models = path.join(__dirname, 'mongodb/models');
const fs = require('fs');
const app = express();
const dbConfig = require('./utils/config/db-config');

//连接mongodb数据库
let dbConnect = dbConfig.prdDBConnnect;
if (process.env.DB_ENV === 'local') {
    dbConnect = dbConfig.localDBConnnect;
}
if (process.env.DB_ENV === 'test') {
    dbConnect = dbConfig.testDBConnnect;
}
mongoose.connect(dbConnect);
//注册mongoose模型，请保持依赖顺序，无依赖的模型置前
require('./mongodb/models/sessionModel');
require('./mongodb/models/ftpModel');
require('./mongodb/models/appModel');
require('./mongodb/models/userModel');
require('./mongodb/models/scheduleModel');
require('./mongodb/models/taskModel');
require('./mongodb/models/userTaskMapModel');
require('./mongodb/models/scheduleLogModel');
require('./mongodb/models/tagLogModel');
require('./mongodb/models/versionDeleteLogModel');
require('./mongodb/models/taskBuildLogModel');

const authFilter = require('./utils/auth-filter');
const prdRoute = require('./routes/prd');
const devRoute = require('./routes/dev');
const apiRoute = require('./routes/api');
// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');

app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto', format: ':method :url :status :response-time ms' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'feapp', resave: true, saveUninitialized: true, store: new MongoStore({ mongooseConnection: mongoose.connection, collection: 'sessionmodels' }) }));
if (app.get('env') === 'dev') {
    app.use('/', devRoute);
} else {
    app.use('/', prdRoute);
}
app.use('/api', authFilter.isLogin, apiRoute);
app.use(ecstatic({ root: path.join(__dirname, 'logs'), baseDir: '/logs' }));

//开发环境服务器错误处理
if (app.get('env') === 'dev') {
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
    app.use(function(err, req, res, next) {
        logger.error(req.url, err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    //线上环境服务器错误处理
    app.use(function(err, req, res, next) {
        if (err.status !== 404) {
            logger.error(req.url, err);
        }
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

module.exports = app;

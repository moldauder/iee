'use strict';

const koa = require('koa');
const routes = require('./routes');
const views = require('koa-views');
const mysql = require('mysql-co');
const json = require('koa-json');
const session = require('koa-session');
const config = require('./config');

const app = module.exports = koa();

//临时用做CORS，开发环境使用
// app.use(function* (next){
// 	this.set('Access-Control-Allow-Origin', 'http://localhost:8001');
// 	this.set('Access-Control-Allow-Origin', '*');
//
// 	yield next;
// });

app.use(json());

app.keys = [config.sessionKey];
session.maxAge = 0;
app.use(session(app));

app.use(views(__dirname + '/views', {
    map: {
        html: 'nunjucks'
    }
}));

let connectionPool = mysql.createPool(config.db);
app.use(function* mysqlConnection(next) {
    this.db = global.db = yield connectionPool.getConnection();
    yield next;
    this.db.release();
});

app.use(routes.routes());
app.use(routes.allowedMethods());

app.listen(3000);

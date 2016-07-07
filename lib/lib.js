'use strict';

const md5 = require('md5');
const Lib = module.exports = {};

/**
 * 错误日志打印
 */
Lib.logException = function(method, e) {
    console.log('UNHANDLED EXCEPTION', method, e.stack || e.message);
};

/**
 * 调用查询
 */
Lib.dbQuery = function(sql){
	console.log('Query DB: ' + sql);
	return global.db.query(sql);
};

/**
 * 密码加密
 */
Lib.encryptPwd = function(pwd){
    return md5(md5(pwd)).substr(0, 24);
};

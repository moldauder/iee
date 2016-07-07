'use strict';

const OSS = require('ali-oss');
const config = require('../config.js').oss;

const store = new OSS({
	region: 'oss-cn-shanghai',
	bucket: config.bucket,
	accessKeyId: config.accessKeyId,
	accessKeySecret: config.accessKeySecret
});

module.exports = store;

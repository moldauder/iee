/**
 * 通用服务
 */
'use strict';

const AliOSS = require('../lib/ali-oss');
const uuid = require('uuid');
const moment= require('moment');

const Common = module.exports = {};

Common.upload = function* (next){
	if('POST' !== this.method) return yield next;

	let image = this.request.body.files.image;
	if(image){
		let saveName = moment().format('YYMMDD') + '/' + (uuid.v1().replace(/-/g, '').substr(0, 16));

		/**
			{
	          "size": 748831,
	          "path": "/tmp/f7777b4269bf6e64518f96248537c0ab.png",
	          "name": "some-image.png",
	          "type": "image/png",
	          "mtime": "2014-06-17T11:08:52.816Z"
	        }
		 */
		//www.npmjs.com/package/ali-oss#putname-file-options
		let object = yield AliOSS.put(saveName, image.path, {
			mime: image.type,
			headers: {
				'Cache-Control': 'max-age=315360000'
			}
		});

		this.body = [{
			uid: saveName,
			name: image.name,
			status: 'done',
			url: object.url,
			thumbUrl: object.url
		}];
	}else{
		this.body = [{
			success: false
		}];
	}
};

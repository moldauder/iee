/**
 * 商店控制
 */
'use strict';
const Entity = require('../models/entity');
const EntityType = 'WeiDianItem';	//存储到表中的类型

const Store = module.exports = {};

/**
 * fp for users
 */
Store.index = function* (){

};

/**
 * api/stores request
 */
Store.all = function* (){
	const pageSize = 40;
	const pageIndex = parseInt(this.request.query.pageIndex || 1, 10);

	let queryParams = {
		where: {
			type: EntityType,
			status: 'publish'
		},
		page: {
			index: pageIndex,
			size: pageSize
		}
	};

	const total = yield Entity.count(queryParams);
	const itemList = yield Entity.all(queryParams);

	this.body = {
		itemList: itemList,
		total: total,
		pageIndex: pageIndex,
		pageSize: pageSize
	};
};

/**
 * save store item
 */
Store.save = function* (){
	let fields = this.request.body.fields;

	try{
		let data = {
			type: EntityType,
			title: fields.title,
			status: 'Publish',
			owner: '1',
			id: fields.id,
			sid: fields.sid || fields.id,
			content: JSON.stringify({
				href: fields.href,
				image: fields.image
			})
		};

		let result = yield Entity.insert(data);
		data.id = result;

		this.body = {
			originId: fields.id,
			data: data,
			success: true
		};
	}catch(e){
		this.body = {
			success: false,
		}
	}
};

/**
 *
 */
Store.item = function* (){
	const item = yield Entity.get(this.params.id);

};

/**
 * 删除条目
 */
Store.delete = function* (){
	const result = yield Entity.delete(this.params.id);
	this.body = {
		success: true
	};
};

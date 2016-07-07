'use strict';

const ModelError = require('./modelError');
const Lib = require('../lib/lib');
const Entity = module.exports = {};

/**
 * 表格字段
 *
 * type 内容类型
 *		Revision
 *  	WeiDianItem
 */
const EntityType_Revision = 'Revision'; //历史记录
const EntityType_None = 'None'; //已删除的记录

Entity.get = function*(id) {
    const result = yield global.db.query('select * from tp_entities where id = ?', id);
    const entities = result[0];
    return entities[0];
};

/**
 * 批量数据查询
 *
 * @param {Object} params
 * @param {Object} params.page 分页条件
 * @param {Object} params.where 查询条件
 * @param {boolean} params.needUserDetail 是否要返回对应的user信息
 */

//分页
Entity.count = function*(params) {
    let queryParams = Object.assign({}, params, {
        count: true
    });
    let result = yield this.all(queryParams);
    return result[0].count;
};

Entity.all = function*(params) {
    let db = global.db;
    let isCountQuery = params.count;
    let fieldStr = isCountQuery ? 'count(*) as count' : 'tp_entities.*';
    let joinStr = '';

    //处理where部分
    let whereStr = [];
    let whereObj = params.where || {};
    for (let key in whereObj) {
        let op = '=';
        let value = whereObj[key];
        if (value.op) {
            op = value.op;
            value = value.value;
        }

        whereStr.push(`${key}${op}` + db.escape(value));
    }
    if (whereStr.length) {
        whereStr = 'WHERE ' + whereStr.join(' AND ');
    }

    let limitStr = '';

    if (!isCountQuery) {
        //返回条件限制
        let pageObj = params.page;
        if (pageObj) {
            limitStr = 'LIMIT ' + (pageObj.index - 1) * pageObj.size + ', ' + pageObj.size;
        }

        //是否要返回用户
        if (params.needUserDetail) {
            fieldStr += ` tp_users.username as username, tp_users.id as userid`;
            joinStr = `LEFT JOIN tp_users on tp_users.id=tp_entities.owner`;
        }
    }

    const result = yield Lib.dbQuery(`SELECT ${fieldStr} FROM tp_entities ${joinStr} ${whereStr} ORDER BY id desc ${limitStr}`);
    return result[0];
};

/**
 * Create new Entity record
 *
 * 整体实现上以加代删，即如果是编辑已有的实体，那么sid=id，最新的sid代表最新的记录，也就是生效的记录
 *
 * @param {Object} values - Entity details
 */
Entity.insert = function*(values) {
    try {
        const db = global.db;

        if(values.id){
            //更新原来的记录，标记为Revision
            yield db.query('update tp_entities set status=? where id=?', [EntityType_Revision, values.id]);

            //清除id信息
            delete values.id;
        }

        const result = yield db.query('insert into tp_entities set ?', values);
        return result[0].insertId;
    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_NULL_ERROR':
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_DEFAULT_FOR_FIELD':
                throw ModelError(403, e.message); // Forbidden
            case 'ER_DUP_ENTRY':
                throw ModelError(409, e.message); // Conflict
            default:
                Lib.logException('Entity.insert', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};

/**
 * 删除Entity
 */
Entity.delete = function*(id) {
    try {
        //删除操作转换为标记操作
        const result = yield global.db.query('update tp_entities set status=? where id=?', [EntityType_None, id]);

        return result[0];
    } catch (e) {
        Lib.logException('Entity.delete', e);
        throw ModelError(500, e.message);
    }
};

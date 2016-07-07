'use strict';

const ModelError = require('./modelError');
const Lib = require('../lib/lib');
const User = module.exports = {};

User.getUserByName = function *(userName){
    const result = yield global.db.query('select * from tp_users where username = ?', userName);
    const entities = result[0];
    return entities[0];
};

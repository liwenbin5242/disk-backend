'use strict';

let RedLock = require('redlock');
let Redis = require('ioredis');

function Rediser() {
    this.redis = null;
    this._status = false;
    this.redlock = null;
}

Rediser.prototype.init = function (conf, callback) {
    let self = this;
    let redis = new Redis({
        port: conf.port,
        host: conf.host,
        db: conf.db,
        password: conf.password,
        retryStrategy: function (times) {
            return Math.min(times * 10, 2000); // delay in ms
        },
    });
    redis.on('connect', function () {
        self._status = true;
        self.redis = redis;
        self.redlock = new RedLock([redis]);
        callback(null);
    });
    redis.on('error', function (err) {
        self._status = false;
        callback(err);
    });
};

Rediser.prototype.get = async function (key) {
    return await this.redis.get(key);
};

Rediser.prototype.set = async function (key, value, time) {
    let self = this;
    value = JSON.stringify(value);
    
    if (!time) {
        await self.redis.set(key, value);
    } else {
        await self.redis.setex(key, time, value);
    }
};

Rediser.prototype.del = function (key, callback) {
    callback = callback || function () { };
    this.redis.del(key, callback);
};

Rediser.prototype.setrange = function (key, index, value) {
    this.redis.setrange(key, index, value);
};

module.exports = new Rediser();
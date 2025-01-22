const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { logger } = require('../utils/logger');
const process = require( 'process' );
const platform = process.platform
const path = require("path");

const DB = {};

DB.SqliteDB = function (file) {
    DB.db = new sqlite3.Database(file);
    DB.exist = fs.existsSync(file);
    if (!DB.exist) {
        logger.warn('db文件不存在!');
    }
    let ext_path = '';
    let dict_path
    DB.db.serialize(function() {
        if (platform === 'win32') {
            ext_path = path.resolve("./sqlite_lib/win/")
            dict_path = "./sqlite_lib/win/dict";
            res = DB.db.loadExtension(path.join(ext_path, "simple"));
        } else {
            ext_path = path.resolve("./sqlite_lib/linux/")
            dict_path = "./sqlite_lib/linux/dict";
            res = DB.db.loadExtension(path.join(ext_path, "libsimple"));
        }
        DB.db.run("select jieba_dict(?)", dict_path);
    })
};

DB.printErrorInfo = function (err) {
    logger.info('Error Message:' + err.message + ' ErrorNumber:' + err.errno);
};

DB.SqliteDB.prototype.init_fts_table = function () {
    DB.db.serialize(function () {
        // 先删除虚拟表
        DB.db.run("DROP TABLE IF EXISTS cache");
        // 创建虚拟表
        DB.db.run("CREATE VIRTUAL TABLE cache USING fts5(server_filename, parent_path, tokenize = 'simple')");
        // 插入数据
        DB.db.run("INSERT INTO cache(server_filename, parent_path) SELECT server_filename, parent_path FROM cache_file");
    });
};


DB.SqliteDB.prototype.createTable = function (sql) {
    DB.db.serialize(function () {
        DB.db.run(sql, function (err) {
            if (err) {
                DB.printErrorInfo(err);
            } else {
                logger.info('createTable success');
            }
        });
    });
};

// / tilesData format; [[level, column, row, content], [level, column, row, content]]
DB.SqliteDB.prototype.insertData = function (sql, objects) {
    DB.db.serialize(function () {
        var stmt = DB.db.prepare(sql);
        for (var i = 0; i < objects.length; ++i) {
            stmt.run(objects[i]);
        }
        stmt.finalize();
    });
};

DB.SqliteDB.prototype.queryData = function (sql, callback) {
    DB.db.all(sql, function (err, rows) {
        if (err) {
            DB.printErrorInfo(err);
        }
        // / deal query data.
        if (callback) {
            callback(rows);
        }
    });
};

DB.SqliteDB.prototype.executeSql = function (sql) {
    DB.db.run(sql, function (err) {
        if (err) {
            DB.printErrorInfo(err);
        } else {
            logger.info(`executeSql ${sql}`);
        }
    });
};

DB.SqliteDB.prototype.close = function () {
    DB.db.close();
};

exports.SqliteDB = DB.SqliteDB;

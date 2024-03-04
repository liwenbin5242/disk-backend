const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { logger } = require('../utils/logger');

const DB = {};
DB.SqliteDB = function (file) {
    DB.db = new sqlite3.Database(file);
    DB.exist = fs.existsSync(file);
    if (!DB.exist) {
        logger.info('Creating db file!');
        fs.openSync(file, 'w');
    }
};

DB.printErrorInfo = function (err) {
    logger.info('Error Message:' + err.message + ' ErrorNumber:' + err.errno);
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

// / export SqliteDB.
exports.SqliteDB = DB.SqliteDB;

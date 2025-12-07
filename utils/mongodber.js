/* eslint-disable no-console */
let { MongoClient } = require('mongodb');
const {logger} = require('../utils/logger');
/*
 * Mongodber class
 */
function Mongodber() {
    this.dbs = {};
}

Mongodber.prototype.init = async function (dbs_conf) {
    this.dbs_conf = dbs_conf;
    let promises = Object.keys(dbs_conf).map(name => (async () => {
        logger.info(`init ${name} db`);
        let db_url = dbs_conf[name];
        let client = new MongoClient(db_url.host, {useUnifiedTopology: true,});
        try {
            logger.info(`mongo url: ${db_url.host}`)
            this.dbs[name] = await client.connect();
        } catch (e) {
            throw new Error(`Init ${name} failed: ${e.message}`);
        }
    })());
    await Promise.all(promises);
};

Mongodber.prototype.use = function (name) {
    return this.dbs[name].db(name);
};

module.exports = new Mongodber();

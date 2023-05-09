const { Pool } = require('pg')
const { logger } = require('../utils/logger');

class PG {
    constructor (config) {
        this.pool = new Pool(config)
    }
    async query(sql, params) {
        const result = await new Promise((resolve, reject)=> {
            this.pool.query(sql, params).then(res => {
                return resolve(res)
            }).catch(err => {
                return reject(err)
            })
        })
       return result
    }
}

module.exports = PG
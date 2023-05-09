'use strict';
const express = require('express');
const router = express.Router();
const { reqHandler } = require('../utils/reqHandler');

router.post('/', reqHandler(async function (req, res) {
    return res.json({ error: 0 });
})
);
module.exports = router;

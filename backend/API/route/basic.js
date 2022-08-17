const express = require('express')
const router = express.Router()
const { ensureGuest } = require('../middleware/checkauth')
const basic = require('../controllers/basic')

router.get(['/', '/home'], ensureGuest, basic.getHome)
router.get('/covid',ensureGuest,basic.getCovid)
module.exports = router
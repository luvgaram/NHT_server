/**
 * Created by eunjoo on 2015. 11. 11..
 */

var express = require('express');
var router = express.Router();
var chat = require('../handlers/chat.js');

router.post('/', chat.create);
router.get('/:getquery', chat.read);

module.exports = router;
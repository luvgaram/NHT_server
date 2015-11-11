/**
 * Created by eunjoo on 2015. 11. 11..
 */

var express = require('express');
var router = express.Router();
var tip = require('../handlers/tip.js');

router.post('/', tip.create);
router.get('/:getquery', tip.read);
router.put('/:putquery', tip.update);
router.delete('/:delquery', tip.remove);

module.exports = router;
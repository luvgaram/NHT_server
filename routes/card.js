/**
 * Created by eunjoo on 2015. 11. 11..
 */

var express = require('express');
var router = express.Router();
var card = require('../handlers/card.js');

router.post('/', card.create);
router.get('/:getquery', card.read);
router.put('/:putquery', card.update);
router.delete('/:delquery', card.remove);

module.exports = router;
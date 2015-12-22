/**
 * Created by eunjoo on 2015. 11. 18..
 */

var express = require('express');
var router = express.Router();
var like = require('../handlers/like.js');

router.post('/:postquery', like.create);
router.put('/:putquery', like.update);
router.get('/:getquery', like.read);
router.delete('/:delquery', like.remove);

module.exports = router;
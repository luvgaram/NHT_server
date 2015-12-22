/**
 * Created by eunjoo on 2015. 11. 18..
 */

var express = require('express');
var router = express.Router();
var reply = require('../handlers/reply.js');

router.post('/', reply.create);
router.get('/:getquery', reply.read);
router.put('/:putquery', reply.update);
router.delete('/:delquery', reply.remove);

module.exports = router;
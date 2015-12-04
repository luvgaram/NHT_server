/**
 * Created by eunjoo on 2015. 12. 3..
 */

var express = require('express');
var router = express.Router();
var users = require('../handlers/users.js');

router.post('/', users.create);
router.get('/:getquery', users.read);
router.put('/:putquery', users.update);
router.delete('/:delquery', users.remove);

module.exports = router;
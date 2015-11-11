/**
 * Created by eunjoo on 2015. 11. 11..
 */

var express = require('express');
var router = express.Router();
var upload = require('../handlers/upload.js');

router.post('/', upload.create);
router.get('/:uploadquery', upload.read);
//router.put('/', upload.update);
router.delete('/', upload.remove);

module.exports = router;
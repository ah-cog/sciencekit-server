const inquiry = require('../lib/inquiry');
exports.create = async (req,res) => { const page = await inquiry.createPage(req.body,req.user); req.app.get('io').emit('page',page); res.json(page); };

const Model = require('../models/bump');
const inquiry = require('../lib/inquiry');
exports.read = async (req,res) => {
  const id = req.query.entryId;
  if(!id) return res.json([]);
  const query = Model.find({entry:id}).sort('tag');

  res.json(await query || []);
};
exports.create = async (req,res) => {
  const data = req.body;
  if(!data.entry || !data.entry) throw inquiry.httpError(400,'entry and entry are required');
  await inquiry.requireDocument(require('../models/moment'),data.entry);
  const fields = {account:req.user._id,entry:data.entry};
  fields.tag=data.tag || "bump"; fields.degree=data.degree || 1;
  const entry = await Model.findOne({entry:fields.entry,account:fields.account,tag:fields.tag}) || await Model.create(fields);

  req.app.get('io').emit('bump',entry);
  res.json(entry);
};

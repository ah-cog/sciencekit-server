const Model = require('../models/tag');
const inquiry = require('../lib/inquiry');
exports.read = async (req,res) => {
  const id = req.query.entryId;
  if(!id) return res.json([]);
  const query = Model.find({entry:id}).sort('text');

  res.json(await query || []);
};
exports.create = async (req,res) => {
  const data = req.body;
  if(!data.text || !data.entry) throw inquiry.httpError(400,'text and entry are required');
  await inquiry.requireDocument(require('../models/moment'),data.entry);
  const fields = {account:req.user._id,entry:data.entry};
  fields.text=data.text;
  const entry = await Model.findOne({entry:fields.entry,text:fields.text}) || await Model.create(fields);

  req.app.get('io').emit('tag',entry);
  res.json(entry);
};

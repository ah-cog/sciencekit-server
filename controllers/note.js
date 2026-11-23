const Model = require('../models/note');
const inquiry = require('../lib/inquiry');
exports.read = async (req,res) => {
  const id = req.query.pageId;
  if(!id) return res.json([]);
  const query = Model.findOne({page:id}).sort('-date');
  query.populate("page");
  res.json(await query || []);
};
exports.create = async (req,res) => {
  const data = req.body;
  if(!data.note || !data.page) throw inquiry.httpError(400,'note and page are required');
  await inquiry.requireDocument(require('../models/page'),data.page);
  const fields = {account:req.user._id,page:data.page};
  fields.note=data.note;
  const entry = await Model.create(fields);
  await entry.populate("page");
  req.app.get('io').emit('note',entry);
  res.json(entry);
};

const inquiry = require('../lib/inquiry');
exports.create = async (req,res) => {
  const data = {...req.body};
  if(req.file) data.uri = '/uploads/' + req.file.filename;
  const entry = await inquiry.create('Observation',data,req.user);
  req.app.get('io').emit('observation',entry);
  res.json(entry);
};

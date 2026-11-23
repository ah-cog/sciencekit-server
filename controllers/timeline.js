const Moment = require('../models/moment');
const inquiry = require('../lib/inquiry');
exports.read = async (req,res) => {
  let id = req.query.id;
  if (req.query.moment_id || req.query.frameId) {
    const moment = await inquiry.requireDocument(Moment, req.query.moment_id || (await Moment.findOne({entry:req.query.frameId}))?._id);
    id = moment.timeline;
  }
  const timeline = await inquiry.timeline(id);
  const filter = {timeline:timeline._id,hidden:{$ne:true}};
  if(req.query.accountId) filter.author = req.query.accountId;
  const moments = await Moment.find(filter).sort({date:-1,_id:-1}).limit(75);
  res.json({_id:timeline._id,moments:await Promise.all(moments.reverse().map(m=>inquiry.populatedMoment(m._id)))});
};
exports.readEntry = async (req,res) => res.json(await inquiry.populatedMoment(req.params.id));

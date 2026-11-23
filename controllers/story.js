const Story = require('../models/story');
const Page = require('../models/page');
const inquiry = require('../lib/inquiry');
exports.create = async (req,res) => { const story = await inquiry.createStory(req.body,req.user); req.app.get('io').emit('story',story); res.json(story); };
exports.read = async (req,res) => {
  const timeline = await inquiry.timeline(req.query.timelineId);
  const stories = await Story.find({timeline:timeline._id,hidden:{$ne:true}}).sort('-date').populate('author').lean();
  for(const story of stories) {
    story.pages = await Page.find({story:story._id}).sort({group:1,position:1,date:1,_id:1}).populate('author').lean();
    for(const page of story.pages) page.entry = await inquiry.populatedMoment(page.entry);
  }
  res.json(stories);
};

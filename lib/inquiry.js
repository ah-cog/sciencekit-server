const Timeline = require('../models/timeline');
const Moment = require('../models/moment');
const Story = require('../models/story');
const Page = require('../models/page');
const models = Object.fromEntries(['Text','Question','Observation','Sequence','Photo','Video','Sketch','Reflection','Collaboration','Identity'].map(type => [type, require('../models/' + type.toLowerCase())]));
const httpError = (status, message) => Object.assign(new Error(message), {status});
async function requireDocument(Model, id) {
  const doc = id && await Model.findById(id);
  if (!doc) throw httpError(404, Model.modelName + ' not found');
  return doc;
}
async function timeline(id) {
  if (id) return requireDocument(Timeline, id);
  return await Timeline.findOne({hidden:false}).sort('date') || Timeline.create({});
}
async function populatedMoment(id) {
  const moment = await requireDocument(Moment, id);
  await moment.populate([{path:'entry', model:moment.entryType}, {path:'author'}]);
  const result = moment.toObject();
  for (const [key, name, field] of [['questions','Question','parent'],['observations','Observation','parent'],['sequences','Sequence','parent'],['bumps','bump','entry'],['collaborations','Collaboration','entry']]) {
    const Model = models[name] || require('../models/' + name);
    const values = await Model.find({[field]:id}).sort('date').lean();
    if(values.length) result[key] = values;
  }
  return result;
}
async function create(type, data, account) {
  const Model = models[type];
  const fields = {author:account._id};
  const allowed = {Text:['text'],Question:['parent','question'],Observation:['parent','cause','effect'],Sequence:['parent','steps'],Photo:['uri'],Video:['uri'],Sketch:['imageData','imageWidth','imageHeight'],Reflection:['text'],Collaboration:['entry','authors'],Identity:['entry','identity']}[type];
  for (const key of allowed) if (data[key] !== undefined) fields[key] = data[key];
  if (type === 'Question') fields.question = data.text ?? data.question;
  if (type === 'Collaboration' || type === 'Identity') fields.entry = data.parent || data.entry;
  const required = {Question:['question'],Observation:['cause','effect'],Sequence:['steps'],Collaboration:['entry'],Identity:['entry','identity'],Photo:['uri'],Video:['uri']}[type] || [];
  for (const key of required) if (!fields[key]) throw httpError(400, key + ' is required');
  if (fields.parent || fields.entry) await requireDocument(Moment, fields.parent || fields.entry);
  const target = await timeline(data.timeline);
  const entry = await Model.create(fields);
  if (type === 'Collaboration' || type === 'Identity') return entry;
  try {
    const moment = await Moment.create({timeline:target._id,author:account._id,entry:entry._id,entryType:type});
    return populatedMoment(moment._id);
  } catch (error) { await Model.deleteOne({_id:entry._id}); throw error; }
}
async function createStory(data, account) {
  if (!data.title?.trim()) throw httpError(400,'title is required');
  const target = await timeline(data.timeline);
  const story = await Story.create({timeline:target._id,author:account._id,title:data.title});
  return story.populate('author');
}
async function createPage(data, account) {
  const story = await requireDocument(Story, data.story);
  if (!story.author.equals(account._id)) throw httpError(403,'Only the author can edit this story');
  await requireDocument(Moment, data.entry);
  const page = await Page.create({story:story._id,author:account._id,entry:data.entry,group:data.group,position:data.position});
  return page.populate('author');
}
module.exports = {create,createStory,createPage,timeline,populatedMoment,requireDocument,httpError};

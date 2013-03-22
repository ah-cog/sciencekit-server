var questionSchema = new mongoose.Schema({
  text: String,
  date: { type: Date, default: Date.now },
  hidden: Boolean
  //author: ,
}, 
{
  autoIndex: false
});
module.exports = mongoose.model('Question', questionSchema); // Compile schema to a model
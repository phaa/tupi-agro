const mongoose = require('mongoose');
const ruleSchema = new mongoose.Schema({
  name: {
      type: String, 
      required: true
  },
  value: {
      type: String,
      required: true
  }
});

const Rule = mongoose.model('Rule', ruleSchema);
module.exports = Rule;

const mongoose = require('mongoose');
const schedulingSchema = new mongoose.Schema({
    taskType: { type: String, enum: ['IRRIGATION', 'FERTIRRIGATION'] },
    executeOn: { type: String },
    stopOn: { type: String },
    active: { type: Boolean },
    section: { type: Number},
  });
//schedulingSchema.index({ executeOn: -1 });

const Scheduling = new mongoose.model('scheduling', schedulingSchema);
module.exports = Scheduling;
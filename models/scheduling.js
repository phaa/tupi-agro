const mongoose = require('mongoose');
const SchedulingSchema = new mongoose.Schema({
    //taskType: { type: String, enum: ['IRRIGATION', 'FERTIRRIGATION'] },
    executeOn: { type: String },
    stopOn: { type: String },
    active: { type: Boolean },
    section: { type: Number},
});

// Quando definir models, user letra maiúscula no começo
const Scheduling = new mongoose.model('Scheduling', SchedulingSchema);
module.exports = Scheduling;
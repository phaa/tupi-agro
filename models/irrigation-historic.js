const mongoose = require('mongoose');
const HistoricSchema = new mongoose.Schema({
    startDate: { type: Date },
    endDate: { type: Date },
    section: { type: Number },
    error: { type: Boolean }
});

const Historic = new mongoose.model('Historic', HistoricSchema);
module.exports = Historic;
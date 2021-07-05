const mongoose = require('mongoose');
const HistoricSchema = new mongoose.Schema({
    startDate: { type: Date },
    endDate: { type: Date },
    scheduling: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheduling',
    },
    error: { type: Boolean }
});

const Historic = new mongoose.model('Historic', HistoricSchema);
module.exports = Historic;
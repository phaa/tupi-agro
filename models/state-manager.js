const mongoose = require('mongoose');
const managerSchema = new mongoose.Schema({
  irrigation: {
    type: Boolean, 
    required: true
  },
  auto_irrigation: {
    type: Boolean, 
    required: true
  },
  exaust: {
    type: Boolean,
    required: true
  },
  auto_exaust: {
    type: Boolean, 
    required: true
  },
  fertirrigation: {
    type: Boolean,
    required: true
  },
  auto_fertirrigation: {
    type: Boolean, 
    required: true
  },
  solenoid_1: {
    type: Boolean,
    required: true
  },
  solenoid_2: {
    type: Boolean, 
    required: true
  }
});

const StateManager = mongoose.model('StateManager', managerSchema);

StateManager.countDocuments({}, (err, count) => {
  console.log('Já existem StateManager: ' + count);
  // Verifica se já existe um manager no BD
  if(count == 0) {
    const Manager = new StateManager({
      irrigation: false,
      auto_irrigation: false,
      exaust: false,
      auto_exaust: false,
      fertirrigation: false,
      auto_fertirrigation: false,
      solenoid_1: false,
      solenoid_2: false
    });
    Manager.save().then(value => {
      console.log(`Um StateManager foi salvo: ${value}`);
    });
  }
});
// Executado apenas uma vez
//const count = StateManager.find().estimatedDocumentCount();
//console.log(count);




module.exports = StateManager;

const StateManagerModel = require('../models/state-manager');

class StateManager {
  constructor() {
    this.soilMoistureThreshold = 50;
    this.minimalOptimalSoilMoisture = 80;
    StateManagerModel.findOne().sort({created_at: 1}).exec((err, result) => {
      this.stateManager = result;
      console.log(`StateManagerORM resultado: ${this.stateManager}`);
    });
  }

  readGreenhouseParams(params) {
    const { soilMoisture, airTemp, airHumidity, store } = params;
    if (this.stateManager.auto_irrigation == false) { //default true
      if (soilMoisture < this.soilMoistureThreshold) {
        console.log("bomba ON");
      } 
      else if (soilMoisture >= this.minimalOptimalSoilMoisture || this.stateManager.irrigation == false) {
        console.log("bomba OFF");
      }
    }
  }
}

module.exports = StateManager;
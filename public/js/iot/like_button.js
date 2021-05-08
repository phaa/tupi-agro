'use strict';

class ControlsManager extends React.Component {

  constructor(props) {
    super(props);
    this.socketIO = io();
    this.state = { socket: this.socketIO };
    this.configureSocketIO = this.configureSocketIO.bind(this);
    this.configureSocketIO();
  }

  configureSocketIO() {
    // Boot
    this.socketIO.emit("pageLoading", "");
    
    
  }

  render() {
    return (
      <div className="row">
        <Card cardTitle={"Controle de Irrigação"} socketIO={this.socketIO} automaticPrefix={"AI"} prefix2={"PUMP"} />
        <Card cardTitle={"Controle de Exaustão"} socketIO={this.socketIO} automaticPrefix={"AE"} prefix2={"EXAUST"} />
        <Card cardTitle={"Controle de Fertirrigação"} socketIO={this.socketIO} automaticPrefix={"AF"} prefix2={"FERT"} />
      </div>
    );
  }
}

class Card extends React.Component {

  constructor(props) {
    super(props);
    this.state = { 
      firstActive: false, 
      secondActive: false
    };

    this.socketIO = props.socketIO;
    this.automaticPrefixes = {
      on: props.automaticPrefix + "_ON",
      off: props.automaticPrefix + "_OFF",
    };
    this.prefixes2 = {
      on: props.prefix2 + "_ON",
      off: props.prefix2 + "_OFF",
    };

    this.texts1 = ["Automático", "Manual"]; 
    this.texts2 = ["Ligado", "Desligado"];

    this.toggleFirstState = this.toggleFirstState.bind(this);
    this.toggleSecondState = this.toggleSecondState.bind(this);

    this.socketIO.on('onGreenhouseCheck', (data) => {
      let { pumpState, exaustingState, fertirrigationState, airHumidity, airTemperature, soilMoisture } = JSON.parse(data);
      // procura saber quais sao os prefixos do card
      // verifica por quais topicos ele atende
      if (this.prefixes2 == 0) {

      }
    });
  }

  // Automatic Inteligence
  toggleFirstState() {
    this.setState({ firstActive: !this.state.firstActive });
    let message = (!this.state.firstActive) ? this.automaticPrefixes.on : this.automaticPrefixes.off;
    // emitir para o backend
    //this.socketIO.emit("onToggleTool_r", message);
  }

  toggleSecondState() {
    this.setState({ secondActive: !this.state.secondActive });
    let message = (!this.state.secondActive) ? this.prefixes2.on : this.prefixes2.off;
    // emitir para o backend e MCU
    this.socketIO.emit("requestToggleTool", message);
  }

  returnLabelText(index, bool) {
    if(index == 1) {
      return bool ? this.texts1[0] : this.texts1[1];
    } else if(index == 2) {
      return bool ? this.texts2[0] : this.texts2[1];
    }
  }

  render() {
    let { firstActive, secondActive } = this.state;
    return (
      <div className="col-lg-4 col-md-4">
        <div className="card">
          <div className="card-header">
            <h5 className="card-category">{this.props.cardTitle}</h5>
            <h4 className={`card-title automatic-control`}>{this.returnLabelText(1, firstActive)}</h4>
            <span className={`toggle-switch ${firstActive ? 'active' : ''}`} onClick={this.toggleFirstState}>
              <span className="toggle-knob"></span>
            </span>
          </div>
          <div className="card-body">
            <h4 className={`card-title automatic-control ${firstActive ? 'not-active-label' : ''}`}>{this.returnLabelText(2, secondActive)}</h4>
            <span className={`toggle-switch ${secondActive ? 'active' : ''} ${firstActive ? 'not-active' : ''}`} onClick={this.toggleSecondState}>
              <span className="toggle-knob"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }
}


ReactDOM.render(<ControlsManager />,document.getElementById('like_button_container'));
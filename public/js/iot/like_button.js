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
    // Requisita o estado atual do arduino para atualizar a UI
    this.socketIO.emit("messageToArduino", {topic: "tupi/agro/estufa", message: "GET_ARDUINO_STATE"});
    this.socketIO.on('initControls', function(data) {
      console.log("ai " + data.aiState)
      console.log("pump " + data.pumpState)
    });
  }

  render() {
    return (
      <div className="row">
        <Card cardTitle={"Controle de Irrigação"} socketIO={this.socketIO}/>
        <Card cardTitle={"Controle de Fertirrigação"} socketIO={this.socketIO} />
      </div>
    );
  }
}

class Card extends React.Component {

  constructor(props) {
    super(props);
    this.state = { 
      firstActive: false, 
      secondActive: false, 
      texts1: ["Automático", "Manual"], 
      texts2: ["Ligado", "Desligado"] 
    };

    this.socketIO = props.socketIO;

    this.toggleFirstState = this.toggleFirstState.bind(this);
    this.toggleSecondState = this.toggleSecondState.bind(this);
  }

  toggleFirstState() {
    this.setState({ firstActive: !this.state.firstActive });
    if (!this.state.firstActive) {
      this.socketIO.emit("messageToArduino", {topic: "tupi/agro/bomba", message: "AI_ON"});
    } else {
      this.socketIO.emit("messageToArduino", {topic: "tupi/agro/bomba", message: "AI_OFF"});
    }
  }

  toggleSecondState() {
    this.setState({ secondActive: !this.state.secondActive });
    if (!this.state.secondActive) {
      this.socketIO.emit("messageToArduino", {topic: "tupi/agro/bomba", message: "PUMP_ON"});
    } else {
      this.socketIO.emit("messageToArduino", {topic: "tupi/agro/bomba", message: "PUMP_OFF"});
    }
  }

  returnLabelText(index, bool) {
    if(index == 1) {
      return bool ? this.state.texts1[0] : this.state.texts1[1];
    } else if(index == 2) {
      return bool ? this.state.texts2[0] : this.state.texts2[1];
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
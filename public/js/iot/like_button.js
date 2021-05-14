'use strict';

class ControlsManager extends React.Component {

  constructor(props) {
    super(props);
    this.state = { 
      alive: false,
      pumpState: 0,
      automaticIrrigation: 0,
      exaustingState: 0,
      automaticExausting: 0,
      fertirrigationState: 0,
      automaticFertirrigation: 0,
      airHumidity: 0,
      airTemperature: 0,
      soilMoisture: 0,
    };
    
    this.setIntervals = this.setIntervals.bind(this);
    this.getGreenhouseData = this.getGreenhouseData.bind(this);
    this.unpackGreenhouseData = this.unpackGreenhouseData.bind(this);

    this.togglePump = this.togglePump.bind(this);
    this.toggleExaust = this.toggleExaust.bind(this);
    this.toggleFertirrigation = this.toggleFertirrigation.bind(this);
    
    this.toggleAutomaticIrrigation = this.toggleAutomaticIrrigation.bind(this);
    this.toggleAutomaticExausting = this.toggleAutomaticExausting.bind(this);
    this.toggleAutomaticFertirrigation = this.toggleAutomaticFertirrigation.bind(this);

    this.getGreenhouseData();
    this.setIntervals();
  }

  setIntervals() {
    // Atualização em tempo real dos dados da estufa
    // posso colocar no esp para retornar os dados da estufa como resposta aos commands
    // para isso eu crio uma função para mandar os dados, para assim reaproveitar o código
    setInterval(() => {
      this.getGreenhouseData();
    }, 2000);
  }

  unpackGreenhouseData(data) {
    this.setState({
      // adicionar alive = false em caso de erro no esp
      alive: true,
      pumpState: data.pumpState,
      automaticIrrigation: data.automaticIrrigation,
      exaustingState: data.exaustingState,
      automaticExausting: data.automaticExausting,
      fertirrigationState: data.fertirrigationState,
      automaticFertirrigation: data.automaticFertirrigation,
      airHumidity: data.airHumidity,
      airTemperature: data.airTemperature,
      soilMoisture: data.soilMoisture,
    });
  }

  getGreenhouseData(data) {
    if (data) {
      this.unpackGreenhouseData(data);
      console.log(data)
    } else {
      // pega pelo axios
      axios.get(`http://192.168.0.108/greenhouse`)
      .then(res => {
        const data = res.data;
        this.unpackGreenhouseData(data);
        document.body.classList.add('loaded');
      });
    }
    
  }

  toggleAutomaticIrrigation(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticIrrigation: state });
    axios.get(`http://192.168.0.108/command?automaticIrrigation=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  toggleAutomaticExausting(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticExausting: state });
    axios.get(`http://192.168.0.108/command?automaticExausting=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  toggleAutomaticFertirrigation(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticFertirrigation: state });
    axios.get(`http://192.168.0.108/command?automaticFertirrigation=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  togglePump(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?pump=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  toggleExaust(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?exaust=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  toggleFertirrigation(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?fertirrigation=${state}`).then(res => { this.getGreenhouseData(res.data) });
  }

  render() {
    return (
      <div className="row">
        <Card cardTitle={"Controle de Irrigação"} 
        toggleFlag1={this.state.automaticIrrigation} callback1={this.toggleAutomaticIrrigation} 
        toggleFlag2={this.state.pumpState} callback2={this.togglePump}/>
        <Card cardTitle={"Controle de Exaustão"} 
        toggleFlag1={this.state.automaticExausting} callback1={this.toggleAutomaticExausting} 
        toggleFlag2={this.state.exaustingState} callback2={this.toggleExaust}/>
        <Card cardTitle={"Controle de Fertirrigação"} 
        toggleFlag1={this.state.automaticFertirrigation} callback1={this.toggleAutomaticFertirrigation} 
        toggleFlag2={this.state.fertirrigationState} callback2={this.toggleFertirrigation}/>
      </div>
    );
  }
}

class Card extends React.Component {

  constructor(props) {
    super(props);

    this.texts1 = ["Automático", "Manual"]; 
    this.texts2 = ["Ligado", "Desligado"];

    this.toggleFirstState = this.toggleFirstState.bind(this);
    this.toggleSecondState = this.toggleSecondState.bind(this);    
  }
 
  // Automatic Inteligence
  toggleFirstState() {
    let bool = !this.props.toggleFlag1;
    this.props.callback1(bool);
    // emitir para o backend
  }

  toggleSecondState() {
    let bool = !this.props.toggleFlag2;
    this.props.callback2(bool);
  }

  returnFirstLabel(bool) {
    return bool ? this.texts1[0] : this.texts1[1];
  }

  returnSecondLabel(bool) {
    return bool ? this.texts2[0] : this.texts2[1];
  }

  render() {
    let { toggleFlag1, toggleFlag2 } = this.props;
    return (
      <div className="col-lg-4 col-md-4">
        <div className="card">
          <div className="card-header">
            <h5 className="card-category">{this.props.cardTitle}</h5>
            <h4 className={`card-title automatic-control`}>{this.returnFirstLabel(toggleFlag1)}</h4>
            <span className={`toggle-switch ${toggleFlag1 ? 'active' : ''}`} onClick={this.toggleFirstState}>
              <span className="toggle-knob"></span>
            </span>
          </div>
          <div className="card-body">
            <h4 className={`card-title automatic-control ${toggleFlag1 ? 'not-active-label' : ''}`}>{this.returnSecondLabel(toggleFlag2)}</h4>
            <span className={`toggle-switch ${toggleFlag2 ? 'active' : ''} ${toggleFlag1 ? 'not-active' : ''}`} onClick={this.toggleSecondState}>
              <span className="toggle-knob"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }
}


ReactDOM.render(<ControlsManager />,document.getElementById('like_button_container'));
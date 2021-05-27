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

    // Refs
    this.soilMoistureChart = React.createRef();
    this.airTemperatureChart = React.createRef();
    this.airHumidityChart = React.createRef();
    
    this.bootstrap = this.bootstrap.bind(this);
    this.getGreenhouseData = this.getGreenhouseData.bind(this);
    this.unpackGreenhouseData = this.unpackGreenhouseData.bind(this);

    this.togglePump = this.togglePump.bind(this);
    this.toggleExaust = this.toggleExaust.bind(this);
    this.toggleFertirrigation = this.toggleFertirrigation.bind(this);
    
    this.toggleAutomaticIrrigation = this.toggleAutomaticIrrigation.bind(this);
    this.toggleAutomaticExausting = this.toggleAutomaticExausting.bind(this);
    this.toggleAutomaticFertirrigation = this.toggleAutomaticFertirrigation.bind(this);

    this.bootstrap();
  }

  bootstrap() {
    this.getGreenhouseData();
    // Atualização em tempo real dos dados da estufa
    // posso colocar no esp para retornar os dados da estufa como resposta aos commands
    // para isso eu crio uma função para mandar os dados, para assim reaproveitar o código
    setInterval(() => { this.getGreenhouseData(); }, 2000);
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
      lastCheck: new Date().getTime(),
    });
  }

  getGreenhouseData() {
    axios.get(`http://192.168.0.108/greenhouse`)
      .then(res => {
        this.unpackGreenhouseData(res.data);
        document.body.classList.add('loaded');
      })
      .catch(error => {
        console.log(error); // Network Error
        console.log(error.status); // undefined
        console.log(error.code); // undefined
        document.body.classList.remove('loaded');
      });
  }

  toggleAutomaticIrrigation(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticIrrigation: state });
    axios.get(`http://192.168.0.108/command?automaticIrrigation=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  toggleAutomaticExausting(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticExausting: state });
    axios.get(`http://192.168.0.108/command?automaticExausting=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  toggleAutomaticFertirrigation(state) {
    if (state) { state = 1; } else {state = 0}
    //this.setState({ automaticFertirrigation: state });
    axios.get(`http://192.168.0.108/command?automaticFertirrigation=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  togglePump(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?pump=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  toggleExaust(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?exaust=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  toggleFertirrigation(state) {
    if (state) { state = 1; } else {state = 0}
    axios.get(`http://192.168.0.108/command?fertirrigation=${state}`).then(res => { this.unpackGreenhouseData(res.data) });
  }

  render() {
    return (
      <div>
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
          <LineChart lastCheck={this.state.lastCheck} color={"#18ce0f"}
          dataSource={this.state.soilMoisture} dataName={"Umidade do solo"} dataMeasureUnit={"%"}/>
          <LineChart lastCheck={this.state.lastCheck} color={"#f96332"}
          dataSource={this.state.airTemperature} dataName={"Temperatura do ar"} dataMeasureUnit={"°C"}/>
          <LineChart lastCheck={this.state.lastCheck} color={"#2CA8FF"}
          dataSource={this.state.airHumidity} dataName={"Umidade do ar"} dataMeasureUnit={"%"}/>
        </div>
        
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

class LineChart extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    let chartColor = "#FFFFFF";
    let ctx = this.canvasRef.current.getContext("2d");

    let gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, this.props.color);
    gradientStroke.addColorStop(1, chartColor);

    let gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    gradientFill.addColorStop(1, hexToRGB(this.props.color, 0.4));

    let chartConfiguration = {
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      tooltips: {
        bodySpacing: 4,
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        xPadding: 10,
        yPadding: 10,
        caretPadding: 10
      },
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            precision: 0
          },
          gridLines: 0,
          gridLines: {
            zeroLineColor: "transparent",
            drawBorder: false
          },
        }],
        xAxes:  [{
          display: 0,
          gridLines: 0,
          ticks: {
            display: false
          },
          gridLines: {
            zeroLineColor: "transparent",
            drawTicks: false,
            display: false,
            drawBorder: false
          }
        }]
      },
      layout: {
        padding: {
          left: 15,
          right:15,
          top: 15,
          bottom: 15
        }
      }
    };

    this.myChart = new Chart(ctx, {
      type: 'line',
      responsive: false,
      data: {
        labels: new Array(),
        datasets: [{
          label: "Leitura (%)",
          borderColor: this.props.color,
          pointBorderColor: "#FFF",
          pointBackgroundColor: this.props.color,
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          fill: true,
          backgroundColor: gradientFill,
          borderWidth: 2,
          data: new Array()
        }]
      },
      options: chartConfiguration
    });

  }

  componentDidUpdate(prevProps) {
    if (prevProps.lastCheck !== this.props.lastCheck) {
      this.addData(this.props.dataSource, this.props.dataSource);
    }
  }

  addData(label, data) {
    this.myChart.data.labels.push(label);
    if(this.myChart.data.labels.length >= 9) { this.myChart.data.labels.shift(); }
    this.myChart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
      if(dataset.data.length >= 9) { dataset.data.shift(); }
    });
    this.myChart.update();
  }

  render() {
    return (
    <div className="col-lg-12 col-md-12">
      <div className="card card-chart">
        <div className="card-header">
          <h5 className="card-category"><b>{this.props.dataSource}</b>{this.props.dataMeasureUnit}</h5>
          <h4 className="card-title">{this.props.dataName}</h4>
        </div>
        <div className="card-body">
          <div className="chart-area">
            <canvas ref={this.canvasRef} />
          </div>
        </div>
        <div className="card-footer">
          <div className="stats">
            <i className="now-ui-icons arrows-1_refresh-69"></i> Em tempo real
          </div>
        </div>
      </div>
    </div>
    );
  }
}

ReactDOM.render(<ControlsManager />,document.getElementById('like_button_container'));
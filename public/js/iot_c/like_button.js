'use strict';

/**
 * Classe que gerencia o cliente Web do servidor MCU
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ControlsManager = function (_React$Component) {
  _inherits(ControlsManager, _React$Component);

  function ControlsManager(props) {
    _classCallCheck(this, ControlsManager);

    var _this = _possibleConstructorReturn(this, (ControlsManager.__proto__ || Object.getPrototypeOf(ControlsManager)).call(this, props));

    _this.state = {
      alive: false,
      pumpState: 0,
      automaticIrrigation: 0,
      exaustingState: 0,
      automaticExausting: 0,
      fertirrigationState: 0,
      automaticFertirrigation: 0,
      airHumidity: 0,
      airTemperature: 0,
      soilMoisture: 0
    };

    // Refs
    _this.soilMoistureChart = React.createRef();
    _this.airTemperatureChart = React.createRef();
    _this.airHumidityChart = React.createRef();

    _this.bootstrap = _this.bootstrap.bind(_this);
    _this.getGreenhouseData = _this.getGreenhouseData.bind(_this);
    _this.unpackGreenhouseData = _this.unpackGreenhouseData.bind(_this);

    _this.togglePump = _this.togglePump.bind(_this);
    _this.toggleExaust = _this.toggleExaust.bind(_this);
    _this.toggleFertirrigation = _this.toggleFertirrigation.bind(_this);

    _this.toggleAutomaticIrrigation = _this.toggleAutomaticIrrigation.bind(_this);
    _this.toggleAutomaticExausting = _this.toggleAutomaticExausting.bind(_this);
    _this.toggleAutomaticFertirrigation = _this.toggleAutomaticFertirrigation.bind(_this);

    _this.bootstrap();
    return _this;
  }

  _createClass(ControlsManager, [{
    key: 'bootstrap',
    value: function bootstrap() {
      var _this2 = this;

      this.getGreenhouseData();
      // Atualização em tempo real dos dados da estufa
      // posso colocar no esp para retornar os dados da estufa como resposta aos commands
      // para isso eu crio uma função para mandar os dados, para assim reaproveitar o código
      setInterval(function () {
        _this2.getGreenhouseData();
      }, 2000);
    }
  }, {
    key: 'unpackGreenhouseData',
    value: function unpackGreenhouseData(data) {
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
        lastCheck: new Date().getTime()
      });
    }
  }, {
    key: 'getGreenhouseData',
    value: function getGreenhouseData() {
      var _this3 = this;

      axios.get('http://192.168.0.144/greenhouse').then(function (res) {
        _this3.unpackGreenhouseData(res.data);
        document.body.classList.add('loaded');
      }).catch(function (error) {
        console.log(error); // Network Error
        console.log(error.status); // undefined
        console.log(error.code); // undefined
        document.body.classList.remove('loaded');
      });
    }
  }, {
    key: 'toggleAutomaticIrrigation',
    value: function toggleAutomaticIrrigation(state) {
      var _this4 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      //this.setState({ automaticIrrigation: state });
      axios.get('http://192.168.0.144/command?automaticIrrigation=' + state).then(function (res) {
        _this4.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'toggleAutomaticExausting',
    value: function toggleAutomaticExausting(state) {
      var _this5 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      //this.setState({ automaticExausting: state });
      axios.get('http://192.168.0.144/command?automaticExausting=' + state).then(function (res) {
        _this5.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'toggleAutomaticFertirrigation',
    value: function toggleAutomaticFertirrigation(state) {
      var _this6 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      //this.setState({ automaticFertirrigation: state });
      axios.get('http://192.168.0.144/command?automaticFertirrigation=' + state).then(function (res) {
        _this6.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'togglePump',
    value: function togglePump(state) {
      var _this7 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      axios.get('http://192.168.0.144/command?pump=' + state).then(function (res) {
        _this7.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'toggleExaust',
    value: function toggleExaust(state) {
      var _this8 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      axios.get('http://192.168.0.144/command?exaust=' + state).then(function (res) {
        _this8.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'toggleFertirrigation',
    value: function toggleFertirrigation(state) {
      var _this9 = this;

      if (state) {
        state = 1;
      } else {
        state = 0;
      }
      axios.get('http://192.168.0.144/command?fertirrigation=' + state).then(function (res) {
        _this9.unpackGreenhouseData(res.data);
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(Card, { cardTitle: "Controle de Irrigação",
            toggleFlag1: this.state.automaticIrrigation, callback1: this.toggleAutomaticIrrigation,
            toggleFlag2: this.state.pumpState, callback2: this.togglePump }),
          React.createElement(Card, { cardTitle: "Controle de Exaustão",
            toggleFlag1: this.state.automaticExausting, callback1: this.toggleAutomaticExausting,
            toggleFlag2: this.state.exaustingState, callback2: this.toggleExaust }),
          React.createElement(Card, { cardTitle: "Controle de Fertirrigação",
            toggleFlag1: this.state.automaticFertirrigation, callback1: this.toggleAutomaticFertirrigation,
            toggleFlag2: this.state.fertirrigationState, callback2: this.toggleFertirrigation }),
          React.createElement(LineChart, { lastCheck: this.state.lastCheck, color: "#18ce0f",
            dataSource: this.state.soilMoisture, dataName: "Umidade do solo", dataMeasureUnit: "%" }),
          React.createElement(LineChart, { lastCheck: this.state.lastCheck, color: "#f96332",
            dataSource: this.state.airTemperature, dataName: "Temperatura do ar", dataMeasureUnit: "°C" }),
          React.createElement(LineChart, { lastCheck: this.state.lastCheck, color: "#2CA8FF",
            dataSource: this.state.airHumidity, dataName: "Umidade do ar", dataMeasureUnit: "%" })
        )
      );
    }
  }]);

  return ControlsManager;
}(React.Component);

var Card = function (_React$Component2) {
  _inherits(Card, _React$Component2);

  function Card(props) {
    _classCallCheck(this, Card);

    var _this10 = _possibleConstructorReturn(this, (Card.__proto__ || Object.getPrototypeOf(Card)).call(this, props));

    _this10.texts1 = ["Automático", "Manual"];
    _this10.texts2 = ["Ligado", "Desligado"];

    _this10.toggleFirstState = _this10.toggleFirstState.bind(_this10);
    _this10.toggleSecondState = _this10.toggleSecondState.bind(_this10);
    return _this10;
  }

  // Automatic Inteligence


  _createClass(Card, [{
    key: 'toggleFirstState',
    value: function toggleFirstState() {
      var bool = !this.props.toggleFlag1;
      this.props.callback1(bool);
      // emitir para o backend
    }
  }, {
    key: 'toggleSecondState',
    value: function toggleSecondState() {
      var bool = !this.props.toggleFlag2;
      this.props.callback2(bool);
    }
  }, {
    key: 'returnFirstLabel',
    value: function returnFirstLabel(bool) {
      return bool ? this.texts1[0] : this.texts1[1];
    }
  }, {
    key: 'returnSecondLabel',
    value: function returnSecondLabel(bool) {
      return bool ? this.texts2[0] : this.texts2[1];
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          toggleFlag1 = _props.toggleFlag1,
          toggleFlag2 = _props.toggleFlag2;

      return React.createElement(
        'div',
        { className: 'col-lg-4 col-md-4' },
        React.createElement(
          'div',
          { className: 'card' },
          React.createElement(
            'div',
            { className: 'card-header' },
            React.createElement(
              'h5',
              { className: 'card-category' },
              this.props.cardTitle
            ),
            React.createElement(
              'h4',
              { className: 'card-title automatic-control' },
              this.returnFirstLabel(toggleFlag1)
            ),
            React.createElement(
              'span',
              { className: 'toggle-switch ' + (toggleFlag1 ? 'active' : ''), onClick: this.toggleFirstState },
              React.createElement('span', { className: 'toggle-knob' })
            )
          ),
          React.createElement(
            'div',
            { className: 'card-body' },
            React.createElement(
              'h4',
              { className: 'card-title automatic-control ' + (toggleFlag1 ? 'not-active-label' : '') },
              this.returnSecondLabel(toggleFlag2)
            ),
            React.createElement(
              'span',
              { className: 'toggle-switch ' + (toggleFlag2 ? 'active' : '') + ' ' + (toggleFlag1 ? 'not-active' : ''), onClick: this.toggleSecondState },
              React.createElement('span', { className: 'toggle-knob' })
            )
          )
        )
      );
    }
  }]);

  return Card;
}(React.Component);

var LineChart = function (_React$Component3) {
  _inherits(LineChart, _React$Component3);

  function LineChart(props) {
    _classCallCheck(this, LineChart);

    var _this11 = _possibleConstructorReturn(this, (LineChart.__proto__ || Object.getPrototypeOf(LineChart)).call(this, props));

    _this11.canvasRef = React.createRef();
    return _this11;
  }

  _createClass(LineChart, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var chartColor = "#FFFFFF";
      var ctx = this.canvasRef.current.getContext("2d");

      var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
      gradientStroke.addColorStop(0, this.props.color);
      gradientStroke.addColorStop(1, chartColor);

      var gradientFill = ctx.createLinearGradient(0, 170, 0, 50);
      gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
      gradientFill.addColorStop(1, hexToRGB(this.props.color, 0.4));

      var chartConfiguration = {
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
          yAxes: [_defineProperty({
            ticks: {
              precision: 0
            },
            gridLines: 0
          }, 'gridLines', {
            zeroLineColor: "transparent",
            drawBorder: false
          })],
          xAxes: [_defineProperty({
            display: 0,
            gridLines: 0,
            ticks: {
              display: false
            }
          }, 'gridLines', {
            zeroLineColor: "transparent",
            drawTicks: false,
            display: false,
            drawBorder: false
          })]
        },
        layout: {
          padding: {
            left: 15,
            right: 15,
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
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps) {
      if (prevProps.lastCheck !== this.props.lastCheck) {
        this.addData(this.props.dataSource, this.props.dataSource);
      }
    }
  }, {
    key: 'addData',
    value: function addData(label, data) {
      this.myChart.data.labels.push(label);
      if (this.myChart.data.labels.length >= 9) {
        this.myChart.data.labels.shift();
      }
      this.myChart.data.datasets.forEach(function (dataset) {
        dataset.data.push(data);
        if (dataset.data.length >= 9) {
          dataset.data.shift();
        }
      });
      this.myChart.update();
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'col-lg-12 col-md-12' },
        React.createElement(
          'div',
          { className: 'card card-chart' },
          React.createElement(
            'div',
            { className: 'card-header' },
            React.createElement(
              'h5',
              { className: 'card-category' },
              React.createElement(
                'b',
                null,
                this.props.dataSource
              ),
              this.props.dataMeasureUnit
            ),
            React.createElement(
              'h4',
              { className: 'card-title' },
              this.props.dataName
            )
          ),
          React.createElement(
            'div',
            { className: 'card-body' },
            React.createElement(
              'div',
              { className: 'chart-area' },
              React.createElement('canvas', { ref: this.canvasRef })
            )
          ),
          React.createElement(
            'div',
            { className: 'card-footer' },
            React.createElement(
              'div',
              { className: 'stats' },
              React.createElement('i', { className: 'now-ui-icons arrows-1_refresh-69' }),
              ' Em tempo real'
            )
          )
        )
      );
    }
  }]);

  return LineChart;
}(React.Component);

ReactDOM.render(React.createElement(ControlsManager, null), document.getElementById('like_button_container'));
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ControlsManager = function (_React$Component) {
  _inherits(ControlsManager, _React$Component);

  function ControlsManager(props) {
    _classCallCheck(this, ControlsManager);

    var _this = _possibleConstructorReturn(this, (ControlsManager.__proto__ || Object.getPrototypeOf(ControlsManager)).call(this, props));

    _this.socketIO = io();
    _this.state = { socket: _this.socketIO };
    _this.configureSocketIO = _this.configureSocketIO.bind(_this);
    _this.configureSocketIO();
    return _this;
  }

  _createClass(ControlsManager, [{
    key: "configureSocketIO",
    value: function configureSocketIO() {
      // Boot
      this.socketIO.emit("messageToArduino", { topic: "tupi/agro/estufa", message: "GET_MEASUREMENTS" });
      this.socketIO.on('onBooting', function (data) {
        console.log("ai " + data.aiState);
        console.log("pump " + data.pumpState);
      });
    }
  }, {
    key: "render",
    value: function render() {
      return React.createElement(
        "div",
        { className: "row" },
        React.createElement(Card, { cardTitle: "Controle de Irrigação", socketIO: this.socketIO, automaticPrefix: "AI", prefix2: "PUMP" }),
        React.createElement(Card, { cardTitle: "Controle de Exaustão", socketIO: this.socketIO, automaticPrefix: "AE", prefix2: "EXAUST" }),
        React.createElement(Card, { cardTitle: "Controle de Fertirrigação", socketIO: this.socketIO, automaticPrefix: "AF", prefix2: "FERT" })
      );
    }
  }]);

  return ControlsManager;
}(React.Component);

var Card = function (_React$Component2) {
  _inherits(Card, _React$Component2);

  function Card(props) {
    _classCallCheck(this, Card);

    var _this2 = _possibleConstructorReturn(this, (Card.__proto__ || Object.getPrototypeOf(Card)).call(this, props));

    _this2.state = {
      firstActive: false,
      secondActive: false
    };

    _this2.socketIO = props.socketIO;
    _this2.automaticPrefixes = {
      on: props.automaticPrefix + "_ON",
      off: props.automaticPrefix + "_OFF"
    };
    _this2.prefixes2 = {
      on: props.prefix2 + "_ON",
      off: props.prefix2 + "_OFF"
    };

    _this2.texts1 = ["Automático", "Manual"];
    _this2.texts2 = ["Ligado", "Desligado"];

    _this2.toggleFirstState = _this2.toggleFirstState.bind(_this2);
    _this2.toggleSecondState = _this2.toggleSecondState.bind(_this2);
    return _this2;
  }

  _createClass(Card, [{
    key: "toggleFirstState",
    value: function toggleFirstState() {
      this.setState({ firstActive: !this.state.firstActive });
      var payload = {
        topic: "tupi/agro/bomba",
        message: !this.state.firstActive ? this.automaticPrefixes.on : this.automaticPrefixes.off
      };
      this.socketIO.emit("messageToArduino", payload);
    }
  }, {
    key: "toggleSecondState",
    value: function toggleSecondState() {
      this.setState({ secondActive: !this.state.secondActive });
      var payload = {
        topic: "tupi/agro/bomba",
        message: !this.state.secondActive ? this.prefixes2.on : this.prefixes2.off
      };
      this.socketIO.emit("messageToArduino", payload);
    }
  }, {
    key: "returnLabelText",
    value: function returnLabelText(index, bool) {
      if (index == 1) {
        return bool ? this.texts1[0] : this.texts1[1];
      } else if (index == 2) {
        return bool ? this.texts2[0] : this.texts2[1];
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _state = this.state,
          firstActive = _state.firstActive,
          secondActive = _state.secondActive;

      return React.createElement(
        "div",
        { className: "col-lg-4 col-md-4" },
        React.createElement(
          "div",
          { className: "card" },
          React.createElement(
            "div",
            { className: "card-header" },
            React.createElement(
              "h5",
              { className: "card-category" },
              this.props.cardTitle
            ),
            React.createElement(
              "h4",
              { className: "card-title automatic-control" },
              this.returnLabelText(1, firstActive)
            ),
            React.createElement(
              "span",
              { className: "toggle-switch " + (firstActive ? 'active' : ''), onClick: this.toggleFirstState },
              React.createElement("span", { className: "toggle-knob" })
            )
          ),
          React.createElement(
            "div",
            { className: "card-body" },
            React.createElement(
              "h4",
              { className: "card-title automatic-control " + (firstActive ? 'not-active-label' : '') },
              this.returnLabelText(2, secondActive)
            ),
            React.createElement(
              "span",
              { className: "toggle-switch " + (secondActive ? 'active' : '') + " " + (firstActive ? 'not-active' : ''), onClick: this.toggleSecondState },
              React.createElement("span", { className: "toggle-knob" })
            )
          )
        )
      );
    }
  }]);

  return Card;
}(React.Component);

ReactDOM.render(React.createElement(ControlsManager, null), document.getElementById('like_button_container'));
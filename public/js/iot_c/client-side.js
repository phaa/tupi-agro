var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ClientSideController = function () {
  function ClientSideController(socket) {
    _classCallCheck(this, ClientSideController);

    this.socket = socket;
    console.log("Socket recebido = " + socket);
    this.uiElements = [];
  }

  _createClass(ClientSideController, [{
    key: "initControls",
    value: function initControls() {}
  }, {
    key: "addUIElement",
    value: function addUIElement(el) {
      this.uiElements.push(el);
    }
  }]);

  return ClientSideController;
}();

var Switch = function () {
  function Switch(labelId, toggleId) {
    _classCallCheck(this, Switch);

    this.activated = false;
    this.label = $(labelId);
    this.toggle = $(toggleId);
  }

  _createClass(Switch, [{
    key: "activate",
    value: function activate() {
      this.toggle.removeClass("not-active");
      this.label.removeClass("not-active-label");
      this.label.text("Ligado");
      this.activated = true;
    }
  }, {
    key: "deactivate",
    value: function deactivate() {
      this.toggle.addClass("not-active");
      this.label.addClass("not-active-label");
      this.label.text("Desligado");
      this.activated = false;
    }
  }]);

  return Switch;
}();
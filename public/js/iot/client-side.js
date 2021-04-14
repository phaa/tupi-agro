class ClientSideController {
  constructor(socket) {
    this.socket = socket;
    console.log("Socket recebido = " + socket);
    this.uiElements = [];
  }

  initControls() {

  }


  addUIElement(el) {
    this.uiElements.push(el);
  }
}

class Switch {
  constructor(labelId, toggleId) {
    this.activated = false;
    this.label = $(labelId);
    this.toggle = $(toggleId);
  }

  activate() {
    this.toggle.removeClass("not-active");
    this.label.removeClass("not-active-label");
    this.label.text("Ligado");
    this.activated = true;
  } 

  deactivate() {
    this.toggle.addClass("not-active");
    this.label.addClass("not-active-label");
    this.label.text("Desligado");
    this.activated = false;
  }
}
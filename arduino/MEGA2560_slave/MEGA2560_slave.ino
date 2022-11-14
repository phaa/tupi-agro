#define CMDBUFFER_SIZE 32

//const uint8_t analog_pins[] = {A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15};

void setup()
{
  Serial.begin(115200);
  Serial.println("Ligando...");

  // Configura todos os pinos digitais como saídas
  for (uint8_t pin = 2; pin <= 53; pin++)
  {
    pinMode(pin, OUTPUT);
  }

  // Configura todos os pinos analógicos como entradas
  for (uint8_t i = A0; i <= A15; i++) {
    pinMode(i, INPUT);
  }
}

void loop()
{

}

void serialEvent()
{
  static char cmdBuffer[CMDBUFFER_SIZE] = "";
  char c;

  // Ponteiro para usar com strtok
  char cmdSeparator[2] = ":";
  char *key;
  char *value;

  while (Serial.available())
  {
    c = processCharInput(cmdBuffer, Serial.read());
    if (c == '\n') // quando for o final da linha
    {
      // Recupera a primeira parte do comando (porta ou adc)
      key = strtok(cmdBuffer, cmdSeparator);

      // Recupera a segunda parte do comando (valor)
      value = strtok(NULL, cmdSeparator);

      if (strcmp(key, "adc") == 0)
      {
        Serial.print("Leitura analogica sensor ");
        Serial.print(value);
        Serial.print(" = ");
        Serial.println(analogRead(value));
      }
      else
      {
        // Liga ou desliga o led de acordo com a entrada
        digitalWrite(atoi(key), atoi(value));
      }

      cmdBuffer[0] = 0; // Reseta o buffer
    }
  }
  delay(1);
}

char processCharInput(char* cmdBuffer, const char c)
{
  // Armazena o caractere recebido no buffer de leitura
  if (c >= 32 && c <= 126) // Ignora os caracteres de controle e especiais ASCII
  {
    if (strlen(cmdBuffer) < CMDBUFFER_SIZE)
    {
      strncat(cmdBuffer, &c, 1);   // Adiciona ao buffer
    }
    else {
      return '\n';
    }
  }
  else if ((c == 8 || c == 127) && cmdBuffer[0] != 0) // Backspace
  {
    cmdBuffer[strlen(cmdBuffer) - 1] = 0;
  }

  return c;
}

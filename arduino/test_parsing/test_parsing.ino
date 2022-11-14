char *commandsList[6]; // Valor máximo de comandos por entrada serial
uint8_t commandCount = 0;

void splitCommands(char *payload)
{
  char cmdSeparator[2] = ";";
  char *token = strtok(payload, cmdSeparator);  // procura por ';'

  while ( token != NULL )
  {
    commandsList[commandCount] = token;
    token = strtok(NULL, cmdSeparator);
    commandCount++;
  }
}

void parseCommands()
{
  char *token;
  token = strtok (NULL, "."); // Aqui o token será "10"

  for (uint8_t i = 0; i < commandCount; i++) {
    //Serial.println("");
    //Serial.println(commandsList[i]);

    char *key = strtok (commandsList[i], "="); // Aqui o token será "ip_address"
    Serial.println(token);

    char *value = strtok (NULL, "="); // Aqui o token será o numero do led
    Serial.println(token);

    digitalWrite(atoi(key), atoi(value));

    // Prepara o token para iteração no array
    /**token = strtok (NULL, "."); // Aqui o token será "10"
    for (int index = 0; index < 2; index++)
    {
      Serial.println(token);
      token = strtok (NULL, ".");   // look for .
    }*/
  }

  //não esquecer de esvaziar o input[] o o command count
} 

void setup() {
  Serial.begin(115200);
  Serial.println("Ligando...");

  // Configura todos os pinos digitais como saídas
  for (uint8_t pin = 2; pin <= 53; pin++)
  {
    pinMode(pin, OUTPUT);
  }

  // converter para um array global depois
  //char input[] = {"ip_address=10.11.12.13;ip_address=13.14.15.16;ip_address=16.17.19.19;"};
  char input[] = {"2=1;3=1;4=1;"};

  // Separa os comandos recebidos
  splitCommands(input);

  // Lê cada comando e executa de acordo
  parseCommands();
  /**
  for (uint8_t i = 0; commandsList[i]; i++)
  {
    Serial.println(commandsList[i]);
  }*/
}

void loop() {
  // put your main code here, to run repeatedly:

}

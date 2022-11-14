

void setup()
{
  Serial.begin(115200);


  char input[] = {"ip_address=10.11.12.13;ip_address=13.14.15.16;ip_address=16.17.19.19;"};
  char cmdSeparator[2] = ";";
  char valueSeparator[2] = "=";
  char *token;
  char *valueToken;
  byte i;

  // Conta quantos comandos foram enviados
  byte cmdCount = 0;
  for (i = 0; input[i]; i++) {
    if (input[i] == ';') {
      cmdCount++;
    }
  }

  Serial.print(cmdCount);
  Serial.println(" Ocorrências");

  // Armazena cada comando em um índice da matriz
  // Cria um array de ponteiros
  const char *myArray[cmdCount];
  token = strtok(input, cmdSeparator);  // procura por ';'
  i = 0;
  while ( token != NULL ) {
    Serial.print(i);
    Serial.println(" Laço do while");
    Serial.println(token);
    myArray[i] = token;
    token = strtok(NULL, cmdSeparator);
    i++;
  }

  Serial.println("\nIterando no array");
  for (i = 0; i < cmdCount; i++) {
    Serial.println(myArray[i]);

    token = strtok (myArray[i], "="); // Aqui o token será "ip_address=10"
    token = strtok (NULL, "."); // Aqui o token será "10"

    for (int index = 0; index < 4; index++)
    {
      Serial.println(token);
      token = strtok (NULL, ".");   // look for .
    }
  }
}

void loop()
{
}


/**
    token = strtok (input, cmdSeparator);  // Look for ;
    while( token != NULL ) {
    Serial.println(token);
    token = strtok(NULL, cmdSeparator);
    }


    Serial.print("Command is : ");
    Serial.println(ptr);
    Serial.println();
    if (strcmp(ptr, "ip_address") == 0)
    {
    Serial.println("Data is : ");
    while (ptr != NULL)
    {
      ptr = strtok (NULL, ".");   // look for .
      Serial.println(ptr);
    }
    }
    else
    {
    Serial.println("Unknown command");
    }
*/

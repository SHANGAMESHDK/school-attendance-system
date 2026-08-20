#include <Wire.h> 
#include <SPI.h>
#include <MFRC522.h>

// --- Pin Definitions ---
// RFID MFRC522 Pins
#define RST_PIN         4          
#define SS_PIN          21         


// --- Objects ---
MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance


String inputString = "";         // a String to hold incoming data from PC
bool stringComplete = false;     // whether the string is complete

void setup() {
  // Initialize Serial Monitor for communication with PC
  Serial.begin(115200);
  



  // Initialize SPI bus and MFRC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(4);
  mfrc522.PCD_DumpVersionToSerial(); // Show details of PCD - MFRC522 Card Reader details
  Serial.println("[INFO] MFRC522 Initialized successfully.");

  // Reserve 200 bytes for the inputString
  inputString.reserve(200);


  
  Serial.println("READY");
  Serial.println("[INFO] System setup complete. Waiting for RFID scans...");
}

void loop() {
  // 1. Check for incoming Serial data from PC
  if (stringComplete) {
    Serial.println("[INFO] Received message from PC: " + inputString);
    processPCMessage(inputString);
    inputString = "";
    stringComplete = false;
  }
  
  // Read from serial port if available
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else if (inChar != '\r') {
      inputString += inChar;
    }
  }

  // 2. Check for new RFID cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Get UID
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();
  
  Serial.println("[INFO] RFID Card Detected! UID: " + uidString);

  // Show on Console
  // Authenticating..
  
  // Send UID to PC
  Serial.println("UID:" + uidString);

  // Halt PICC to stop reading the same card multiple times quickly
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  // Await PC response (will be handled by stringComplete logic above)
}

void processPCMessage(String msg) {
  // Message format from PC: 
  // MSG:<Name>,<Phone>,<LateStatus>
  // UNKNOWN
  
  if (msg.startsWith("MSG:")) {
    String data = msg.substring(4);
    int firstComma = data.indexOf(',');
    int secondComma = data.indexOf(',', firstComma + 1);
    
    if (firstComma > 0 && secondComma > 0) {
      String name = data.substring(0, firstComma);
      String phone = data.substring(firstComma + 1, secondComma);
      String status = data.substring(secondComma + 1);
      
      delay(3000); // Wait 3 seconds
      Serial.println("[INFO] Processed MSG. Back to scan mode.");
    } else {
      Serial.println("[ERROR] Failed to parse MSG: " + msg);
    }
  } else if (msg.startsWith("CONFIG:WIFI,")) {
    String data = msg.substring(12);
    int commaIdx = data.indexOf(',');
    if (commaIdx > 0) {
      String ssid = data.substring(0, commaIdx);
      String pass = data.substring(commaIdx + 1);
      Serial.println("[INFO] WiFi credentials updated: " + ssid);
      delay(2000);
    }
  } else if (msg.startsWith("UNKNOWN")) {
    Serial.println("[INFO] Processed UNKNOWN. Card is unregistered.");
    delay(2000);
  } else {
    Serial.println("[WARNING] Unrecognized message from PC: " + msg);
  }
}



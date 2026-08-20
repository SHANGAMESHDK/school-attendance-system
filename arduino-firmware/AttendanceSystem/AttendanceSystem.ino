#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>

// --- Pin Definitions ---
// RFID MFRC522 Pins
#define RST_PIN         4          
#define SS_PIN          21         


// --- Objects ---
MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance
LiquidCrystal_I2C lcd(0x3F, 16, 2); // Set the LCD address to 0x27 for a 16 chars and 2 line display


String inputString = "";         // a String to hold incoming data from PC
bool stringComplete = false;     // whether the string is complete

void setup() {
  // Initialize Serial Monitor for communication with PC
  Serial.begin(115200);
  


  // Initialize LCD
  lcd.begin();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Initializing");

  // Initialize SPI bus and MFRC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(4);
  mfrc522.PCD_DumpVersionToSerial(); // Show details of PCD - MFRC522 Card Reader details
  Serial.println("[INFO] MFRC522 Initialized successfully.");

  // Reserve 200 bytes for the inputString
  inputString.reserve(200);


  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Please Tap ID Card");
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

  // Show on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Authenticating..");
  
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
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Hi " + name.substring(0, 12)); // Max 12 chars
      lcd.setCursor(0, 1);
      lcd.print(status);
      

      
      delay(3000); // Wait 3 seconds
      lcd.setCursor(0, 0);
      lcd.print("Please Tap ID Card");
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
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("WiFi Configured!");
      Serial.println("[INFO] WiFi credentials updated: " + ssid);
      delay(2000);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Please Tap ID Card");
    }
  } else if (msg.startsWith("UNKNOWN")) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Unknown Card!");
    Serial.println("[INFO] Processed UNKNOWN. Card is unregistered.");
    delay(2000);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Please Tap ID Card");
  } else {
    Serial.println("[WARNING] Unrecognized message from PC: " + msg);
  }
}



// /utils/checkDatabaseData.ts
export const checkExistingData = async () => {
    try {
      const firebase = await import("firebase/app");
      const database = await import("firebase/database");
      
      const firebaseConfig = {
        apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
        authDomain: "agrisense-f4c16.firebaseapp.com",
        databaseURL: "https://agrisense-f4c16-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "agrisense-f4c16",
        storageBucket: "agrisense-f4c16.firebasestorage.app",
        messagingSenderId: "655954688754",
        appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
      };
      
      const app = firebase.initializeApp(firebaseConfig, 'checkDataApp');
      const db = database.getDatabase(app);
      
      console.log("Checking database at:", firebaseConfig.databaseURL);
      
      // Check root
      const rootRef = database.ref(db, '/');
      const rootSnapshot = await database.get(rootRef);
      
      if (rootSnapshot.exists()) {
        const rootData = rootSnapshot.val();
        const keys = Object.keys(rootData);
        
        console.log("📊 Database contents:");
        console.log(`Total keys at root: ${keys.length}`);
        
        keys.forEach(key => {
          console.log(`- ${key}:`, typeof rootData[key] === 'object' ? 
            `Object with ${Object.keys(rootData[key] || {}).length} keys` : 
            rootData[key]);
        });
        
        // Check specifically for your sensor data
        if (rootData['ph level'] !== undefined || rootData['soil moisture'] !== undefined) {
          console.log("\n🌱 Found your sensor data:");
          console.log("- pH level:", rootData['ph level']);
          console.log("- Soil moisture:", rootData['soil moisture']);
        }
        
        return {
          success: true,
          message: "Database check successful",
          totalKeys: keys.length,
          keys: keys,
          data: rootData
        };
      } else {
        console.log("📊 Database is empty");
        return {
          success: true,
          message: "Database is empty",
          totalKeys: 0,
          keys: [],
          data: null
        };
      }
      
    } catch (error: any) {
      console.error("Database check failed:", error);
      return {
        success: false,
        message: `Database check failed: ${error.message}`,
        error: error
      };
    }
  };
  
  // Add sensor data if missing
  export const addSensorData = async () => {
    try {
      const firebase = await import("firebase/app");
      const database = await import("firebase/database");
      
      const firebaseConfig = {
        apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
        authDomain: "agrisense-f4c16.firebaseapp.com",
        databaseURL: "https://agrisense-f4c16-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "agrisense-f4c16",
        storageBucket: "agrisense-f4c16.firebasestorage.app",
        messagingSenderId: "655954688754",
        appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
      };
      
      const app = firebase.initializeApp(firebaseConfig, 'addSensorDataApp');
      const db = database.getDatabase(app);
      
      // Add your sensor data
      const sensorData = {
        "ph level": 4,
        "soil moisture": 50,
        "temperature": 25,
        "lastUpdated": new Date().toISOString(),
        "location": "Default Farm"
      };
      
      const sensorRef = database.ref(db, 'sensorData');
      await database.set(sensorRef, sensorData);
      
      console.log("✅ Sensor data added:", sensorData);
      
      return {
        success: true,
        message: "Sensor data added successfully",
        data: sensorData
      };
      
    } catch (error: any) {
      console.error("Failed to add sensor data:", error);
      return {
        success: false,
        message: `Failed to add sensor data: ${error.message}`
      };
    }
  };
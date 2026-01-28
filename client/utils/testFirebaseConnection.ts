// /utils/testFirebaseConnection.ts
export const testFirebaseDirectly = async () => {
    console.log("🚀 Starting Firebase test with correct URL...");
    
    try {
      // Dynamically import Firebase
      const firebase = await import("firebase/app");
      const database = await import("firebase/database");
      
      console.log("✅ Firebase modules loaded");
      
      // CORRECT configuration with Asia region
      const firebaseConfig = {
        apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
        authDomain: "agrisense-f4c16.firebaseapp.com",
        databaseURL: "https://agrisense-f4c16-default-rtdb.asia-southeast1.firebasedatabase.app", // CORRECT
        projectId: "agrisense-f4c16",
        storageBucket: "agrisense-f4c16.firebasestorage.app",
        messagingSenderId: "655954688754",
        appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
      };
      
      console.log("Initializing Firebase with URL:", firebaseConfig.databaseURL);
      
      // Initialize Firebase
      const app = firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase app initialized");
      
      // Get database
      const db = database.getDatabase(app);
      console.log("✅ Database instance created");
      
      // Create test reference
      const testRef = database.ref(db, 'testConnection');
      console.log("Test ref created:", testRef.toString());
      
      // Test write
      console.log("Testing write operation...");
      await database.set(testRef, {
        timestamp: new Date().toISOString(),
        message: "Test successful with correct URL!",
        app: "AgriSense",
        testId: Math.random().toString(36).substring(7),
        region: "asia-southeast1"
      });
      
      console.log("✅ Test data written");
      
      // Test read
      console.log("Testing read operation...");
      const snapshot = await database.get(testRef);
      const data = snapshot.val();
      console.log("✅ Test data read:", data);
      
      // List existing farms if any
      console.log("Checking for existing data...");
      try {
        const rootRef = database.ref(db, '/');
        const rootSnapshot = await database.get(rootRef);
        console.log("Root data available:", Object.keys(rootSnapshot.val() || {}));
      } catch (listError) {
        console.log("Could not list root data:", listError.message);
      }
      
      return {
        success: true,
        message: "Firebase test successful with correct Asia region URL!",
        data: data,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error("❌ Firebase test failed:", error);
      
      // Check for specific Firebase errors
      let errorMessage = error.message;
      if (error.code) {
        errorMessage = `Firebase error ${error.code}: ${error.message}`;
      }
      
      return {
        success: false,
        message: `Firebase test failed: ${errorMessage}`,
        error: {
          message: error.message,
          code: error.code,
          name: error.name
        },
        timestamp: new Date().toISOString()
      };
    }
  };
  
  // Quick connection test
  export const quickConnectionTest = async () => {
    try {
      const firebase = await import("firebase/app");
      
      const firebaseConfig = {
        apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
        authDomain: "agrisense-f4c16.firebaseapp.com",
        databaseURL: "https://agrisense-f4c16-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "agrisense-f4c16",
        storageBucket: "agrisense-f4c16.firebasestorage.app",
        messagingSenderId: "655954688754",
        appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
      };
      
      const app = firebase.initializeApp(firebaseConfig);
      console.log("Quick test: Firebase initialized");
      
      return {
        success: true,
        message: "Quick connection test successful",
        databaseURL: firebaseConfig.databaseURL
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Quick test failed: ${error.message}`
      };
    }
  };
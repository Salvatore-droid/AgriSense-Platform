// client/utils/firebaseTest.ts
import { getDatabase, ref, set, push, get } from "firebase/database";
import { app } from "@/config/firebase";

export const addTestFarm = async () => {
  try {
    console.log("🌱 Adding test farm to Firebase...");
    
    const db = getDatabase(app);
    
    const testFarm = {
      name: "Test Farm",
      location: "Test Location",
      totalAcres: 50,
      cropTypes: ["Maize", "Wheat"],
      soilType: "Loamy",
      irrigationType: "Drip",
      status: "healthy",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sensorData: {
        soilMoisture: 50,
        pH: 4,
        temperature: 25,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Add to farms collection
    const farmsRef = ref(db, 'farms');
    const newFarmRef = push(farmsRef);
    await set(newFarmRef, testFarm);
    
    console.log("✅ Test farm added with ID:", newFarmRef.key);
    
    // Verify it was added
    const snapshot = await get(newFarmRef);
    const addedFarm = snapshot.val();
    
    return {
      success: true,
      message: "Test farm added successfully",
      farmId: newFarmRef.key,
      farmData: addedFarm
    };
    
  } catch (error: any) {
    console.error("❌ Failed to add test farm:", error);
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
};

export const listAllFarms = async () => {
  try {
    const db = getDatabase(app);
    const farmsRef = ref(db, 'farms');
    const snapshot = await get(farmsRef);
    
    if (snapshot.exists()) {
      const farms = snapshot.val();
      const farmCount = Object.keys(farms).length;
      console.log(`📊 Found ${farmCount} farms in database`);
      
      return {
        success: true,
        count: farmCount,
        farms: farms
      };
    } else {
      console.log("📊 No farms found in database");
      return {
        success: true,
        count: 0,
        farms: {}
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to list farms:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
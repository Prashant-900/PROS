import connectDB from "./connectdb.controller.js";
import User from "../model/user.js";

export async function insertUser(userid) {
  try {
    const connection = await connectDB();

    // First try to find existing user
    const existingUser = await User.findOne({ userid });
    if (existingUser) {
      return existingUser;
    }

    // If not found, create new user
    const newUser = new User({ userid });
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    console.error("Failed to insert/find user:", error.message);
    throw error;
  }
}

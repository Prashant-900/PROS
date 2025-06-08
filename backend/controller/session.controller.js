import connectDB from "./connectdb.controller.js";
import User from "../model/user.js";

export async function addsession(userid, name) {
  try {
    const connection = await connectDB();
    const user = await User.findOne({ userid });

    if (!user) {
      return { message: "User not found" };
    }

    // Push directly and get reference to the pushed subdocument
    const addedSession = user.session.create({ name }); // creates a Mongoose subdocument
    user.session.push(addedSession);
    await user.save();

    return {
      message: "Session added successfully",
      session: addedSession, // includes _id and name
    };
  } catch (error) {
    console.error("Failed to add session:", error.message);
    throw error;
  }
}

export async function deletesession(sessionid) {
  try {
    await connectDB(); // Await the DB connection

    const user = await User.findOneAndUpdate(
      { "session._id": sessionid },
      { $pull: { session: { _id: sessionid } } }
    );

    if (!user) {
      return { message: "User not found" };
    }

    return { message: "Session deleted successfully" };
  } catch (error) {
    console.error("Failed to delete session:", error.message);
    throw error;
  }
}

export async function getsession(userid) {
  try {
    await connectDB(); // Await the DB connection

    const user = await User.findOne({ userid }); // Await the query
    if (!user) {
      return { message: "User not found", sessions: [] };
    }

    const sessions = user.session || []; // Return empty array if undefined

    return {
      message: "Session fetched successfully",
      sessions,
    };
  } catch (error) {
    console.error("Failed to get session:", error.message);
    throw error;
  }
}


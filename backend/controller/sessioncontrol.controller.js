import User from "../model/user.js";
import connectDB from "./connectdb.controller.js";

export async function requestUser(name, sessionid) {
  try {
    const connection = await connectDB();

    // Find the user who owns the session with the given sessionid
    const user = await User.findOne({ "session._id": sessionid });
    if (!user) {
      return { message: "User with this session not found." };
    }

    // Find the specific session object within the user's sessions
    const session = user.session.find(
      (s) => s._id.toString() === sessionid.toString()
    );

    if (!session) {
      return { message: "Session not found." };
    }

    // Push the name into users_requested
    if (!session.users_requests.includes(name) && !session.allowed_users.includes(name)) {
      session.users_requests.push(name);
    }

    // Save the updated user document
    await user.save();

    return { message: "Request added successfully" };
  } catch (error) {
    console.error("Failed to request user:", error.message);
    throw error;
  }
}

export async function getRequestUser(userid, sessionid) {
  try {
    const connection = await connectDB();

    // Find the user by their userid
    const user = await User.findOne({ userid });

    if (!user) {
      return { message: "User not found.", users_requests: [] };
    }

    // Find the specific session by _id
    const session = user.session.find(
      (s) => s._id.toString() === sessionid.toString()
    );

    if (!session) {
      return { message: "Session not found.", users_requests: [] };
    }

    // Return the requested users
    return {
      message: "Users retrieved successfully",
      users_requests: session.users_requests || [],
    };
  } catch (error) {
    console.error("Failed to get requested users:", error.message);
    throw error;
  }
}


export async function addToAllowedUsers(userid, sessionid, name, right) {
  try {
    await connectDB();

    const user = await User.findOne({ userid });
    if (!user) throw new Error("User not found");

    const session = user.session.id(sessionid); // Mongoose subdoc access
    if (!session) throw new Error("Session not found");

    // Remove name from users_requests
    session.users_requests = session.users_requests.filter(req => req !== name);

    // Add to allowed_users if not already added
    const alreadyAllowed = session.allowed_users.find(u => u.name === name);
    if (!alreadyAllowed) {
      session.allowed_users.push({ name, right });
    }

    await user.save();

    return { message: "User moved to allowed_users", allowed_users: session.allowed_users };
  } catch (error) {
    console.error("Failed to add to allowed_users:", error.message);
    throw error;
  }
}

export async function getAllowedUsers(userid, sessionid) {
  try {
    await connectDB();

    const user = await User.findOne({ userid });
    if (!user) throw new Error("User not found");

    const session = user.session.id(sessionid);
    if (!session) throw new Error("Session not found");

    return { allowed_users: session.allowed_users || [] };
  } catch (error) {
    console.error("Failed to get allowed users:", error.message);
    throw error;
  }
}



export async function checkAllowedUser(sessionid, name) {
  try {
    await connectDB();

    // Find the user who has this session
    const user = await User.findOne({ "session._id": sessionid });

    if (!user) throw new Error("User with given session not found");

    // Find the specific session
    const session = user.session.id(sessionid);
    if (!session) throw new Error("Session not found");

    // Check if name is in allowed_users
    const isAllowed = session.allowed_users.some(
      (u) => (typeof u === "string" ? u === name : u.name === name)
    );

    return {
      allowed: isAllowed,
      owner_userid: user.userid,  // Returning the session owner's userid
    };
  } catch (error) {
    console.error("Failed to check allowed user:", error.message);
    throw error;
  }
}



export async function removeFromUserRequests(userid, sessionid, name) {
  try {
    await connectDB();

    const user = await User.findOne({ userid });
    if (!user) throw new Error("User not found");

    const session = user.session.id(sessionid);
    if (!session) throw new Error("Session not found");

    session.users_requests = session.users_requests.filter(req => req !== name);
    await user.save();

    return { message: "User removed from users_requests", users_requests: session.users_requests };
  } catch (error) {
    console.error("Failed to remove from users_requests:", error.message);
    throw error;
  }
}

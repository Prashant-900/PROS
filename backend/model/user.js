import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  allowed_users: { type: [{name:{type:String},right:{type:String}}], default: [] },
  users_requests: { type: [String], default: [],duplicate: false },
});

const userSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  session: { type: [sessionSchema], default: [] }, // array of session objects
});

const User = mongoose.model("User", userSchema);
export default User;

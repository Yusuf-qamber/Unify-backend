const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },       
    email: { type: String, index: true, lowercase: true, trim: true },
    hashedPassword: {                              
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    googleId: { type: String, index: true },
    picture: String,
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    authSource:{
    type:String,
    enum:["self","google"],
    default:"self"
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.hashedPassword;
    return ret;
  },
});


const User = mongoose.model("User", userSchema);

module.exports = User;

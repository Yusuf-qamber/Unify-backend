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
    
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    authSource:{
    type:String,
    enum:["self","google"],
    default:"self"
    },

    picture: {
      type: String,
      default:
        "https://res.cloudinary.com/dyrdy3hwe/image/upload/v1759161159/user_hinyhl.png", 
    },
    myNotes:[{type:mongoose.Schema.Types.ObjectId,
      ref:"Note"
    }],
    myEvents:[{type:mongoose.Schema.Types.ObjectId,
      ref:"Event"
    }]

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

const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const eventSchema= new mongoose.Schema({

  owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  title:{
    type:String, required:true,
  },

location: {
  type: String,
  required: true,
},
coordinates: {
  lat: { type: Number },
  lng: { type: Number },
},



  description:{
    type:String,
    required:true,
  },
  college:{
    type:String,
    required:true,
    enum:["it","business","science","law","engineering","art"],
  },
  comments:[commentSchema],
  
},

{timestamps:true}
)

const Event= mongoose.model("Event",eventSchema)
module.exports=Event
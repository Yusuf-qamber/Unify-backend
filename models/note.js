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

const noteSchema= new mongoose.Schema({

  owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  title:{
    type:String, required:true,
  },

  file_url:{
    type:String,
   required:true
  }
  ,
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

const Note= mongoose.model("Note",noteSchema)
module.exports=Note
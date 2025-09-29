const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Event = require("../models/event.js");
const router = express.Router({ mergeParams: true });
const existingCollege = Event.schema.path('college').enumValues;
const User = require("../models/user");



// -------------------Puplic routes------------------

router.get("/", async (req, res) => {
   if (!existingCollege.includes(req.params.college)) {
    return res.status(404).json({ error: `College '${req.params.college}' does not exist` });
  }
  try {
    
    const events = await Event.find({ college: req.params.college })
      .populate("owner")
      .sort({ createdAt: "desc" })
    res.status(200).json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



router.get("/:eventId",async(req,res)=>{
  try{
    const event=await Event.findById(req.params.eventId).populate("owner").populate("comments.author")
    if(!event){
      return res.status(404).json({err:"Event not found"})
    }
    res.status(200).json(event)
  }catch(err){
    res.status(500).json(err)
  }
})


// ----------------------Protected routes-----------
router.use(verifyToken)

router.post("/", async (req, res) => {
  try {
    req.body.owner = req.user._id;
    req.body.college = req.params.college; 

    const event = await Event.create(req.body);

    await User.findByIdAndUpdate(req.user._id, { $push: { myEvents: event._id } });

    res.status(200).json(event);
  } catch (err) {
    console.error(err);  
    res.status(500).json({ error: err.message });
  }
});





router.put("/:eventId",async(req,res)=>{
  try{
    const event=await Event.findById(req.params.eventId)
    if(!event){
      return res.status(404).send("Event not found")
    }

    if(!event.owner.equals(req.user._id)){
      return res.status(403).send("You are not autharized")
    }

    const updateEvent=await Event.findByIdAndUpdate(req.params.eventId, req.body ,{new:true})
    res.status(200).json(updateEvent)

  }catch(err){
    res.status(500).json(err)
  }
})




router.delete("/:eventId",async(req,res)=>{
  try{
    const event= await Event.findById(req.params.eventId)
    if(!event.owner.equals(req.user._id)){
      return res.status(403).send("You are not autharized")
    }

    const deletedEvent=await Event.findByIdAndDelete(req.params.eventId)
    res.status(200).json(deletedEvent)
  }catch(err){
    res.status(500).json(err)
  }
})


router.post('/:eventId/comments', async (req,res)=>{
try{
    req.body.author = req.user._id;
    const event =await Event.findById(req.params.eventId).populate("comments.author", "username");
    event.comments.push(req.body);
    await event.save()

    
    const newComment = event.comments[event.comments.length - 1];
    newComment._doc.author = req.user;

    
        res.status(201).json(newComment);

}
catch(err){
 res.status(500).json(err);
}
})


router.put('/:eventId/comments/:commentId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate("comments.author", "username");;

    const comment = event.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: "You are not authorized to edit" });
    }

    comment.content = req.body.content;
    await event.save();

    res.status(200).json({message: 'Comment updated successfully' ,comment});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.delete('/:eventId/comments/:commentId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    event.comments.remove({ _id: req.params.commentId });
    await event.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});



module.exports = router;
const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Note = require("../models/note.js");

const router = express.Router({ mergeParams: true });
const existingCollege = Note.schema.path('college').enumValues;
const User = require("../models/user");



// -------------------Puplic routes------------------

router.get("/", async (req, res) => {
   if (!existingCollege.includes(req.params.college)) {
    return res.status(404).json({ error: `College '${req.params.college}' does not exist` });
  }
  try {
    
    const notes = await Note.find({ college: req.params.college })
      .populate("owner")
      .sort({ createdAt: "desc" })
    res.status(200).json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



router.get("/:noteId",async(req,res)=>{
  try{
    const note=await Note.findById(req.params.noteId).populate("owner").populate("comments.author")
    if(!note){
      return res.status(404).json({err:"Note not found"})
    }
    res.status(200).json(note)
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

    const note = await Note.create(req.body);

  
    await User.findByIdAndUpdate(req.user._id, { $push: { myNotes: note._id } });

    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






router.put("/:noteId",async(req,res)=>{
  try{
    const note=await Note.findById(req.params.noteId)
    if(!note){
      return res.status(404).send("Note not found")
    }

    if(!note.owner.equals(req.user._id)){
      return res.status(403).send("You are note autharized")
    }

    const updateNote=await Note.findByIdAndUpdate(req.params.noteId, req.body ,{new:true})
    res.status(200).json(updateNote)

  }catch(err){
    res.status(500).json(err)
  }
})




router.delete("/:noteId",async(req,res)=>{
  try{
    const note= await Note.findById(req.params.noteId)
    if(!note.owner.equals(req.user._id)){
      return res.status(403).send("You are not autharized")
    }

    const deletedNote=await Note.findByIdAndDelete(req.params.noteId)
    res.status(200).json(deletedNote)
  }catch(err){
    res.status(500).json(err)
  }
})


router.post('/:noteId/comments', async (req,res)=>{
try{
    req.body.author = req.user._id;
    const note =await Note.findById(req.params.noteId).populate("comments.author", "username");
    note.comments.push(req.body);
    await note.save()

    
    const newComment = note.comments[note.comments.length - 1];
    newComment._doc.author = req.user;

    
        res.status(201).json(newComment);

}
catch(err){
 res.status(500).json(err);
}
})


router.put('/:noteId/comments/:commentId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId).populate("comments.author", "username");;

    const comment = note.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: "You are not authorized to edit" });
    }

    comment.content = req.body.content;
    await note.save();

    res.status(200).json({message: 'Comment updated successfully' ,comment});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.delete('/:noteId/comments/:commentId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    note.comments.remove({ _id: req.params.commentId });
    await note.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;
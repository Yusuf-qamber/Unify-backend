const express = require("express");
const router = express.Router();
const User = require("../models/user");
const verifyToken = require("../middleware/verify-token");
const upload = require("../config/multer");

router.use(verifyToken); // protect all routes

// GET profile
router.get("/me", async (req, res) => {
  try {
    const profile = await User.findById(req.user._id)
      .populate("myNotes")
      .populate("myEvents"); 

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    res.status(200).json({
      username: profile.username,
      picture: profile.picture,
      email: profile.email,
      myNotes: profile.myNotes,
      myEvents: profile.myEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try{
    const { userId } = req.params;
    const user = await User.findById(userId).populate("myNotes").populate("myEvents");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);   
  } catch(err){
    res.status(500).json({err:err.message})
  }

});


// EDIT PROFILE (USERNAME OR PICTURE)
router.put("/me", upload.single("picture"), async (req, res) => {
  try {
    // let { username } = req.body;
    const updates = {};

    // if (username) updates.username = username;

    if (req.file) {
  
      updates.picture = req.file.path;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    )
      .populate("myNotes")
      .populate("myEvents");

    if (!updatedProfile) return res.status(404).json({ error: "Profile not found" });

    res.status(200).json({
      username: updatedProfile.username,
      picture: updatedProfile.picture,
      email: updatedProfile.email,
      myNotes: updatedProfile.myNotes,
      myEvents: updatedProfile.myEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE ACCOUNT
router.delete("/me", async (req, res) => {
  try {
    const deletedProfile = await User.findByIdAndDelete(req.user._id);

    if (!deletedProfile) return res.status(404).json({ error: "Profile not found" });

    res.status(200).json({ msg: "Account deleted successfully", deletedProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

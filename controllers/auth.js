const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();
const User = require("../models/user");

const SALT_ROUNDS = 12;
const signToken = (user) =>
  jwt.sign(
    { _id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );


router.post("/sign-up", async (req, res) => {
  try {
    const { username, password, email,picture } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        err: "Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

   
    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      if (existing.username === username) {
        return res.status(409).json({ err: "Username already used" });
      }
      if (existing.email === email) {
        return res.status(409).json({ err: "Email already used" });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      hashedPassword,
      authProvider: "local",
    });

    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    return res.status(400).json({ err: "Invalid, please try again." });
  }
});




router.post("/sign-in", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(401).json({ err: "Invalid credentials" });

    const ok = bcrypt.compareSync(req.body.password, user.hashedPassword || "");
    if (!ok) return res.status(401).json({ err: "Invalid credentials" });

    return res.status(200).json({ token: signToken(user), user });
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});


module.exports = router;

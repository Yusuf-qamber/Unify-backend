const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const cookieParser = require('cookie-parser');

const router = express.Router();
const User = require("../models/user");

const SALT_ROUNDS = 12;
const oAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const signToken = (user) =>
  jwt.sign(
    { _id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );


router.post("/sign-up", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ err: "Username already used" });

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email: null,
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



router.post("/google-auth", async (req, res) => {
  const { credential, client_id } = req.body;

  try {
    // Verify token with Google's API
    const ticket = await oAuthClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || client_id,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub, picture } = payload;

    // find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: `${given_name} ${family_name}`,
        email,
        googleId: sub,
        picture,
        authProvider: "google",
      });
    } else {
      // ensure googleId and provider are set if user existed from local sign-up
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = "google";
        await user.save();
      }
    }

    // sign our own JWT
    const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Send token in JSON response and as cookie (optional)
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,      // set true in production with HTTPS
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ token, user });
  } catch (err) {
    console.error("Google auth error:", err.message || err);
    res.status(400).json({ error: "Authentication failed", details: err.message || err });
  }
});


module.exports = router;

/* eslint-disable prefer-destructuring */
const jwt = require('jsonwebtoken');
const express = require('express');

const router = express.Router();

router.get('/sign-token', (req, res) => {
  const user = {
    _id: 1,
    username: 'test',
    password: 'test',
    hahahahaha: 'not secure',
  };

  const token = jwt.sign(user, process.env.JWT_SECRET);

  res.json({ token });
});

router.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({ decoded });
  } catch (err) {
    res.status(401).json({ err: 'Invalid token.' });
  }
});

module.exports = router;

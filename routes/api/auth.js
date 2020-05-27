const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route  GET api/auth
// @desc   Test route
// @access Public

router.get('/', auth, async (req, res) => {
  try {
    // since it protected route and we use the token we
    // have the id in the middleweare req.user and we
    // can access it anywhere in protective route
    // and we don't want to return the passwor
    // .select() specify which doc field to include or exclude
    const user = await User.findById(req.user.id).select('-password');
    // here after send my token in header key "x-auth-token"
    // will get all user data except password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  POST api/auth
// @desc   Authenticate user & get token (for login)
// @access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'password is requider').exists(),
  ],
  async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // we can do mongoose query here using promis get back
    // User.*this return a promis -->*findOne().then() or .catch()
    // but we will use Async way

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // until here we checked user email and
      // now will check password(1-plain text pass that
      // user enters)&(2-from user getted from DB)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          // in mongoDB it _id field in the document
          // in mongoose it's just id for simplisity
          id: user.id,
        },
      };

      // sign the payload into jwt
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      // insted of this we return the token if there is not err
      //res.send('User registered');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;

const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route [actual req type] GET [end point] api/users
// @desc [of what the route does] test route
// @access value public[dont need token] or private
//         [token to access specific route to add profile => must be
//         authenticated so you needd to send token to that route to work
//         other than say: unauthorize access or anything]
//
// each route must have these three things:
// @route  POST api/users
// @desc   Register user and return token
// @access Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmail(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'please enter a password with 6 or more charavters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // we can do mongoose query here using promis get back
    // User.*this return a promis -->*findOne().then() or .catch()
    // but we will use Async way

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exist' }] });
      }

      // Get users gravatar (from thier email)
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      // will return a promise so we can use user.id in jwt
      await user.save();

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

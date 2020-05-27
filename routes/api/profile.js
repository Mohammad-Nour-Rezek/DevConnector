const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const mongoose = require('mongoose');
// @route  GET api/profile/me %%% me based on user id(_id)
// in the token, and api/profile will get all profiles (later)
// @desc   Get current users profile
// @access Private --> we get user profile based on _id
// in the token so it need to send a token and for that
// we need to get middleware auth

// use async/await cuz we use mongoose that return a promise
router.get('/me', auth, async (req, res) => {
  try {
    // (user:) has id from profile and we will set it to user id
    // that come from the token (req.user.id), and we want to populate this
    // with user name and avatar thats in User model
    // now this line is query
    const profile = await Profile.findOne({
      // is this _id exist in profile model
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile
// @desc   Create or update user profile
// @access Private
// uses auth middleware and validations from express-validator
router.post(
  '/',
  [
    auth,
    [
      // will check for required fields
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Status is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    // if it has errors will not be empty
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      // here find by the user, user field is the object id,
      // match user id come from the token with user id
      // in the Profile Schema in profile model
      // whenever use mongoose use await
      let profile = await Profile.findOne({ user: req.user.id });

      // if there is a profile we will updated
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        res.json(profile);
      }

      // if not will created
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  GET api/profile
// @desc   Get all profiles
// @access Public

router.get('/', async (req, res) => {
  try {
    // add name and avatar which it's part of user model
    // 'user': collectin(model), ['name', 'avatar']: fields
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/profile/user/:user_id
// :user_id is a placeholder(will take _id value)
// @desc   Get profile by user ID
// @access Public
// copy user id from postman get all profiles or from DB or any where
// and past it after /user/[here-->5ebbe1c973d4e02c3c353c05]
router.get('/user/:user_id', async (req, res) => {
  try {
    // add name and avatar which it's part of user model
    // 'user': collectin(model), ['name', 'avatar']: fields
    // here find by: 'user' and the id come from
    // the url using: req.params.user_id
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    // check if there is profile to the user
    // if id not valid pattern will rise an error
    if (!profile)
      // will work if id is wrong not valid chars but the same id length
      return res.status(400).json({ msg: 'Profile not found1' });

    res.json(profile);
  } catch (err) {
    // will work if pass not valid object id (long chars)
    // but here we will return the same message for two situations
    // ex: maybe /user/1 --> will return 'Profile not found' not 'server error'
    console.error(err.message);
    // insted of err.kind == 'ObjectId'
    if (!mongoose.Types.ObjectId.isValid(req.params.user_id)) {
      return res.status(400).json({ msg: 'Profile not found2' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user & posts
// @access Private

router.delete('/', auth, async (req, res) => {
  try {
    // it's private because we have access to the token
    // so match user id with id come in the body from middleware
    // @todo - remove users posts
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/experience
// @desc   Add profile experience
// @access Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index by match id from req with the id in the exp. array
    const removeIndex = profile.experience
      // first create a new array that have all id's and then found index
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/education
// @desc   Add profile education
// @access Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  DELETE api/profile/education/:edu_id
// @desc   Delete education from profile
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index by match id from req with the id in the exp. array
    const removeIndex = profile.education
      // first create a new array that have all id's and then found index
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/profile/github/:username
// @desc   Get user repos from github
// @access Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      // require request module
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No github peofile found' });
      }

      // need parse cuz may contain `strings${}.......`
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

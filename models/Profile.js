const mongoose = require('mongoose');

// the profile has profile object id created by mongoDB
// it's diffirent from user id
const ProfileSchema = new mongoose.Schema({
  // every profile must associate with user so link by _id
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  company: {
    type: String,
  },
  website: {
    type: String,
  },
  location: {
    type: String,
  },
  // developer status like juniore,associat,expert,student
  // it will be drop down to choose from
  status: {
    type: String,
    required: true,
  },
  // must show in profile and will entered like (csv
  // js, python,...) in react and we will convert it to array
  skills: {
    type: [String],
    required: true,
  },
  bio: {
    type: String,
  },
  // if he want to add github repo. so will use github API
  githubusername: {
    type: String,
  },
  experience: [
    {
      title: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      location: {
        type: String,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      // will have checkbox and if it true the 'to' will disable
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  education: [
    {
      school: {
        type: String,
        required: true,
      },
      degree: {
        type: String,
        required: true,
      },
      fieldofstudy: {
        type: String,
        required: true,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  social: {
    youtube: {
      type: String,
    },
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    instagram: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// the profile has profile object id it's diffirent from user id
module.exports = Profile = mongoose.model('profile', ProfileSchema);

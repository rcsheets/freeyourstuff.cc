'use strict';
// External dependencies
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

// Internal dependencies
const config = require('../load-config');

// Schema definition
let userSchema = mongoose.Schema({

  isModerator: Boolean, // access to reversible & low-risk operations
  isAdmin: Boolean, //  mod rights + access to hard to reverse & high-risk operations
  isTester: Boolean, // generated content will be flagged for filtering/removal
  local: {
    username: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 256,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return !(/[<>'"]/.test(v));
        },
        message: 'registerfail-char'
      }
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 256
    },
    password: String
  },
  facebook: {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    email: String,
    displayName: String
  },
  twitter: {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    displayName: String,
    username: String
  },
  google: {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    email: String,
    displayName: String
  }
});

// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

userSchema.statics.findByName = function(name) {
  return this.findOne({'local.username': name.toUpperCase()});
};

userSchema.methods.getDisplayName = function() {
  return this.local.displayName || this.twitter.displayName ||
    this.facebook.displayName || this.google.displayName || null;
};

userSchema.methods.getLink = function(linkTitle) {
  let url = config.baseURL + 'user/' + this._id;
  return `<a href="${url}">${linkTitle || this.getDisplayName()}</a>`;
};

userSchema.methods.getMethod = function() {
  if (this.local && this.local.displayName)
    return 'local';
  else if (this.twitter && this.twitter.displayName)
    return 'twitter';
  else if (this.facebook && this.facebook.displayName)
    return 'facebook';
  else if (this.google && this.google.displayName)
    return 'google';
  else
    return null;
};

userSchema.methods.canModerate = function() {
  return this.isAdmin || this.isModerator ? true : false;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);

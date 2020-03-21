const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10; // salt will be of 10 characters https://stackoverflow.com/questions/46693430/what-are-salt-rounds-and-how-are-salts-stored-in-bcrypt  https://gooroo.io/GoorooTHINK/Article/13023/The-difference-between-encryption-hashing-and-salting/2085#.Xm4B9qgzaUk

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxLength: 50
  },
  email: {
    type: String,
    trim: true,
    unique: 1 // email has to be unique
  },
  password: {
    type: String,
    minLength: 5
  },
  lastName: {
    type: String,
    maxlength: 50
  },
  role: {
    type: Number, // (normal user, user and admin)
    default: 0 // normal user
  },
  token: {
    type: String
  },
  tokenExp: {
    type: Number
  }
});

console.log(this, "outside");

// pwd + salt value = hash value
// Say your password is rocky and the salt value is i.love.salt. The hash value would be made up from both of these together rockyi.love.salt
userSchema.pre("save", function(next) {
  // run salt genr only if password is given or pwd is changed
  if (!this.isModified("password")) return next();

  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) return next(err); // this means if error occurs we dont anything and proceed with further action i.e save, as save comes after this pre save

    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = (plainPassword, cb) => {
  bcrypt.compare(plainPassword, userSchema.password, (err, isMatch) => {
    if (err) return cb(err);

    cb(null, isMatch);
  });
};

userSchema.methods.generateToken = cb => {
  let token = jwt.sign(userSchema._id.toHexString(), "mysecret");
  userSchema.token = token;
  userSchema.save((err, user) => {
    if (err) return cb(err);

    cb(null, user);
  });
};

userSchema.statics.findByToken = function(token, cb) {
  // user id + mysecret = token , thr4 token - mysecret = user id
  jwt.verify(token, "mysecret", function(err, decode) {
    this.findOne({ _id: decode, token: token }, function(err, user) {
      if (err) return cb(err);
      cb(null, user);
    });
  });
};

const User = mongoose.model("User", userSchema);
module.exports = { User };

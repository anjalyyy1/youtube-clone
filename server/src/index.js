const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { User } = require("./models/user");
const { auth } = require("./middleware/auth");
const config = require("./config/keys");

const port = process.env.PORT || 5000; // port set by heroku
// configure port
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});

// db connections
const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost/youtubeClone", {
    useNewUrlParser: true,
    useUnifiedTopology: true // useNewUrlParser, useUnifiedTopology to remove deprecation warnings
  })
  .then(() => {
    console.log("db is connected");
  })
  .catch(err => {
    console.log(err, "error occured");
  });

// configure middleware
app.use(bodyParser.urlencoded({ extended: true })); // remove deprecation warning
app.use(bodyParser.json());
app.use(cookieParser());

// routing
app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/api/user/auth", auth, (req, res) => {
  //send data wch we got from middleware to client
  res.status(200).json({
    _id: req._id,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role
  });
});

//registration route
app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
      message: "User registered successfully"
    });
  });
});

// login route
app.post("/api/user/login", (req, res) => {
  // search for email, compare password and generate token
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        login: false,
        message: "User not found"
      });

    user.comparePassword(req.body.password, (err, isMatch) => {
      console.log(req.body.password, "is the plain pwd");
      if (!isMatch) {
        return res.json({
          login: false,
          message: "Wrong password entered"
        });
      }

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        // if success put tht token into a cookie
        res
          .cookie("x-auth", user.token)
          .status(200)
          .json({
            login: true
          });
      });
    });
  });
});

app.get("/api/user/logout", auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { token: "", tokenExp: "" },
    (err, doc) => {
      if (err)
        return res.json({
          success: false,
          err
        });

      return res.status(200).send({
        success: true
      });
    }
  );
});

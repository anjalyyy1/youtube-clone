const { User } = require("../models/user");

//Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next.
let auth = (req, res, next) => {
  let token = req.cookies.x_auth;

  User.findByToken(token, (err, user) => {
    if (err) throw err;

    if (!user) {
      return res.json({
        isAuth: false,
        error: true
      });
    }

    req.token = token; // this is passed from this middleware to the function
    req.user = user;

    next();
  });
};

module.exports = { auth };

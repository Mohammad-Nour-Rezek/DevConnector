const jwt = require('jsonwebtoken');
const config = require('config');

// a middleware func has access to req, res cycle(objects),
// next: is callback we want call to move to next step
module.exports = function (req, res, next) {
  // GET token form the header req
  // when we send req to protected routes
  // must pass token with the header to get routes
  // now this is the header key we want to send in token
  // in postman for test and it's value the token string
  const token = req.header('x-auth-token');

  // check if no token
  if (!token) {
    res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // will decode the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // set value to user from the payload user prop
    req.user = decoded.user;
    next();
  } catch (err) {
    // if token has invalid string
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

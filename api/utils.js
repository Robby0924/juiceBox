function requireUser(req, res, next) {
  if (!req.user) {
    next({
      name: "MissingUserError",
      message: "You must be logged in to perform this action",
    });
  }

  next();
}


// //----------------------NEW------------------------

// function requireActiveUser(req, res, next) {
//   if (!req.user.active) {
//     next({
//       name: "UserInactiveError",
//       message: "User is no longer active",
//     });
//   }
// }

module.exports = {
  requireUser,
//   requireActiveUser,
};

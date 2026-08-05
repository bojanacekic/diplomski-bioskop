export const toUserForm = (user) => ({
  firstName: user.firstName ?? "",
  lastName: user.lastName ?? "",
  username: user.username,
  email: user.email,
});

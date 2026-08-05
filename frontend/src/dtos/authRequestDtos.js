export const toAuthRequestDto = (registering, registerForm, loginForm) =>
  registering ? { ...registerForm } : { ...loginForm };
export const toForgotPasswordRequestDto = (usernameOrEmail) => ({ usernameOrEmail });
export const toResetPasswordRequestDto = (token, newPassword) => ({ token, newPassword });

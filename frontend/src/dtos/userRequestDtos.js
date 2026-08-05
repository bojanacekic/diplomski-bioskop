export const toUpdateUserRequestDto = (form) => ({ ...form });
export const toChangePasswordRequestDto = (currentPassword, newPassword) => ({
  currentPassword,
  newPassword,
});
export const toChangeUserRoleRequestDto = (role) => ({ role: Number(role) });

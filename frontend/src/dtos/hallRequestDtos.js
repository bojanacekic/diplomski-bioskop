export const toHallRequestDto = (form) => ({
  ...form,
  type: Number(form.type),
  rows: Number(form.rows),
  seatsPerRow: Number(form.seatsPerRow),
});

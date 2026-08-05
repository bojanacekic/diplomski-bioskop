export const toScreeningRequestDto = (form, startsAtUtc, endsAtUtc) => ({
  ...form,
  startsAtUtc,
  endsAtUtc,
  baseTicketPrice: Number(form.baseTicketPrice),
});

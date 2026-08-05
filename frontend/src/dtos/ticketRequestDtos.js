export const toPurchaseTicketRequestDto = (reservationId, paymentForm) => ({
  reservationId,
  ...paymentForm,
});
export const toCashTicketRequestDto = (reservationId) => ({ reservationId });
export const toValidateTicketRequestDto = (code) => ({ code });

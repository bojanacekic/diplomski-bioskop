export const toScreeningForm = (screening) => {
  const localStart = new Date(screening.startsAtUtc);
  localStart.setMinutes(localStart.getMinutes() - localStart.getTimezoneOffset());
  return {
    movieId: screening.movieId,
    hallId: screening.hallId,
    startsAtUtc: localStart.toISOString().slice(0, 16),
    baseTicketPrice: screening.baseTicketPrice,
    status: screening.status,
  };
};

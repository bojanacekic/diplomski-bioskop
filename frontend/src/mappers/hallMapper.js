export const toHallForm = (hall) => ({
  name: hall.name,
  type: hall.type,
  rows: hall.rows,
  seatsPerRow: hall.seatsPerRow,
});

export const calculateNextDonationDate = (lastDonationDate: Date, gender: 'male' | 'female') => {
  const daysToAdd = gender === 'male' ? 60 : 90;
  const nextDate = new Date(lastDonationDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
};

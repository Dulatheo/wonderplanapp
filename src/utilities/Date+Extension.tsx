export const formatTimestamp = (createdAt: number): string => {
  const date = new Date(createdAt * 1000); // Convert seconds to milliseconds

  // Format date components
  const month = date.toLocaleString('default', {month: 'short'});
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const amPm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  const formattedHours = hours % 12 || 12;

  return `${month} ${day} ${formattedHours}:${minutes} ${amPm}`;
};

export function formatPhone(phone: string) {
  if (/^7\d{10}$/.test(phone))
    return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
  return phone ? `+${phone}` : "";
}

export function extractEmailFromText(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  if (matches && matches.length > 0) {
    // Filter out common non-contact emails
    const filteredEmails = matches.filter(
      (email) =>
        !email.includes('example.com') &&
        !email.includes('noreply') &&
        !email.includes('no-reply')
    );
    return filteredEmails.length > 0 ? filteredEmails[0] : matches[0];
  }
  return '';
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

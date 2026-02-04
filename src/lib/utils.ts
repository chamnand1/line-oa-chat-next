export function getAvatarUrl(userId: string, pictureUrl?: string): string {
  if (pictureUrl) return pictureUrl;

  const seed = userId ? userId.slice(0, 2) : "UN";
  return `https://ui-avatars.com/api/?name=${seed}&background=10b981&color=fff`;
}

// Builds a user-facing message from an Axios error.
// In development the server adds `detail`/`hint` (never in production), so they show up on screen.
export function getErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (!data) return err?.message ? `${fallback} (${err.message})` : fallback;
  const parts = [data.message || fallback];
  if (data.detail) parts.push(`(${data.detail})`);
  if (data.hint) parts.push(`— ${data.hint}`);
  return parts.join(' ');
}

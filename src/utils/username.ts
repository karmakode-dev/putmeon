/** Username rules for PMO Accounts V1 */

export const RESERVED_USERNAMES = new Set([
  'putmeon',
  'pmo',
  'admin',
  'support',
  'staff',
  'official',
  'team',
])

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

export function validateUsername(input: string): string | null {
  const username = normalizeUsername(input)

  if (username.length < 3 || username.length > 20) {
    return 'Username must be 3–20 characters.'
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return 'Use lowercase letters, numbers, underscores, and periods only.'
  }
  if (username.startsWith('.') || username.endsWith('.')) {
    return 'Username cannot start or end with a period.'
  }
  if (RESERVED_USERNAMES.has(username)) {
    return 'That username is reserved.'
  }
  return null
}

export function isUsernameComplete(username: string | null | undefined): boolean {
  return Boolean(username && validateUsername(username) === null)
}

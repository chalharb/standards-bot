export function validateRegex(text: string, pattern: RegExp) {
  return pattern.test(text)
}

export function validatePrefix(text: string, prefix: string) {
  return text.startsWith(prefix)
}

export function validateMaxLength(text: string, max_length: number) {
  return text.length <= max_length
}

export function validateMinLength(text: string, min_length: number) {
  return text.length >= min_length
}

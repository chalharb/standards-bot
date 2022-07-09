export function validateRegex(text: string, pattern: string): boolean {
  return new RegExp(pattern).test(text)
}

export function validatePrefix(text: string, prefix: string): boolean {
  return text.startsWith(prefix)
}

export function validateMaxLength(text: string, max_length: number): boolean {
  return text.length <= max_length
}

export function validateMinLength(text: string, min_length: number): boolean {
  return text.length >= min_length
}

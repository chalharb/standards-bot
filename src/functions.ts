import styles from 'ansi-styles'
import {StatusObject} from './types'

export function validateRegex(text: string, pattern: string): boolean {
  return new RegExp(pattern).test(text)
}

export function validatePrefix(text: string, prefix: string): boolean {
  return prefix.split(',').some(substr => text.startsWith(substr))
}

export function validateMaxLength(text: string, max_length: number): boolean {
  return text.length <= max_length
}

export function validateMinLength(text: string, min_length: number): boolean {
  return text.length >= min_length
}

export function cyanText(text: string): string {
  return `${styles.cyan.open}${text}${styles.cyan.close}`
}

export function greenText(text: string): string {
  return `${styles.green.open}${text}${styles.green.close}`
}

export function yellowText(text: string): string {
  return `${styles.yellow.open}${text}${styles.yellow.close}`
}

export function setStatusObject(
  state: boolean | 'debug',
  message: string
): StatusObject {
  return {
    state,
    message
  }
}

import {
  validateRegex,
  validatePrefix,
  validateMaxLength,
  validateMinLength
} from './functions'

const mockText = 'AB#1234: This is a test message'
const mockTextLength = mockText.length

describe('Text Regex', () => {
  test('matches', async () => {
    expect(validateRegex(mockText, /^AB#\d{4,6}:\s/)).toBe(true)
  })

  test('does not match', async () => {
    expect(validateRegex(mockText, /^AC#\d{4,6}:\s/)).toBe(false)
  })
})

describe('Text Prefix', () => {
  test('is correctly prefixed', async () => {
    expect(validatePrefix(mockText, 'AB#')).toBe(true)
  })

  test('is incorrectly prefixed', async () => {
    expect(validatePrefix(`Issue: ${mockText}`, 'AB#')).toBe(false)
  })
})

describe('Max Text Length', () => {
  test('is less than max allowed length', async () => {
    expect(validateMaxLength(mockText, mockTextLength)).toBe(true)
  })

  test('is greater than max allowed length', async () => {
    expect(validateMaxLength(mockText, mockTextLength - 1)).toBe(false)
  })

  test('is equal to max allowed length', async () => {
    expect(validateMaxLength(mockText, mockTextLength)).toBe(true)
  })
})

describe('Min Text Length', () => {
  test('is greater than min allowed length', async () => {
    expect(validateMinLength(mockText, mockTextLength - 1)).toBe(true)
  })

  test('is less than min allowed length', async () => {
    expect(validateMinLength(mockText, mockTextLength + 1)).toBe(false)
  })

  test('is equal to min allowed length', async () => {
    expect(validateMinLength(mockText, mockTextLength)).toBe(true)
  })
})

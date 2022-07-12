export interface PullRequestData {
  owner: string
  repo: string
  pull_number: number
}

export type Valid = 'debug' | boolean
export interface StatusObject {
  state: Valid
  message: string
}

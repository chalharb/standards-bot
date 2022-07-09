import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  validateRegex,
  validatePrefix,
  validateMaxLength,
  validateMinLength
} from './helpers'

type Inputs = {
  authToken: string
  pr_title_regex: string
  pr_title_prefix: string
  pr_title_min_length: number
  pr_title_max_length: number
  commit_message_regex: string
  commit_message_prefix: string
  commit_min_length: number
  commit_max_length: number
  check_pull_requests: boolean
  check_commits: boolean
}

function getInputs(): Inputs {
  return {
    authToken: core.getInput('github-token'),
    pr_title_regex: core.getInput('pr-title-regex'),
    pr_title_prefix: core.getInput('pr-title-prefix'),
    pr_title_min_length: parseInt(core.getInput('pr-title-min-length')),
    pr_title_max_length: parseInt(core.getInput('pr-title-max-length')),
    commit_message_regex: core.getInput('commit-message-regex'),
    commit_message_prefix: core.getInput('commit-message-prefix'),
    commit_min_length: parseInt(core.getInput('commit-min-length')),
    commit_max_length: parseInt(core.getInput('commit-max-length')),
    check_pull_requests:
      core.getInput('pr-title-regex') ||
      core.getInput('pr-title-prefix') ||
      core.getInput('pr-title-min-length') ||
      core.getInput('pr-title-max-length')
        ? true
        : false,
    check_commits:
      core.getInput('commit-message-regex') ||
      core.getInput('commit-message-prefix') ||
      core.getInput('commit-min-length') ||
      core.getInput('commit-max-length')
        ? true
        : false
  }
}

function validateEvents(events: string[]): boolean {
  return events.some(event => event === 'pull_request')
}

async function run(): Promise<void> {
  try {
    core.debug('Standards Bot Starting Analysis')
    const validEvents = ['pull_request']

    core.debug('Checking if the event is a pull request')
    if (!validateEvents(validEvents)) {
      core.debug('Standards Bot Skipping Analysis')
      return
    }

    core.debug('Fetching input parameters')
    const inputs = getInputs()

    core.debug('Debug: Setting up the GitHub client')
    const owner = github.context.payload.pull_request?.base.user.login
    const repo = github.context.payload.pull_request?.base.repo.name
    const pr_number = github.context.payload.pull_request?.number as number
    const octokit = github.getOctokit(inputs.authToken)

    core.debug('Debug: Setting up the GitHub client payload')
    const payload = {
      owner,
      repo,
      pull_number: pr_number
    }

    if (inputs.check_pull_requests) {
      core.debug('Fetching Pull Request Data')
      const {data: pullRequestData} = await octokit.rest.pulls.get(payload)

      const pr_title = pullRequestData.title

      if (inputs.check_pull_requests) {
        // Check if PR title passes regex
        if (inputs.pr_title_regex) {
          if (!validateRegex(pr_title, inputs.pr_title_regex)) {
            core.setFailed(
              `Pull Request title "${pr_title}" failed to pass match regex - ${RegExp(
                inputs.pr_title_regex
              )}`
            )
            return
          } else {
            core.info(
              `Pull Request title "${pr_title}" passed regex - ${inputs.pr_title_regex}`
            )
          }
        } else {
          core.debug(
            `Debug: No Pull Request title regular expression specified for validation`
          )
        }

        // Check if PR title starts with prefix
        if (inputs.pr_title_prefix) {
          if (!validatePrefix(pr_title, inputs.pr_title_prefix)) {
            core.setFailed(
              `Pull Request title "${pr_title}" is does not start with ${inputs.pr_title_prefix}`
            )
            return
          } else {
            core.info(
              `Pull Request title "${pr_title}" starts with ${inputs.pr_title_prefix}`
            )
          }
        } else {
          core.debug(
            `Debug: No pull request title prefix specified for validation`
          )
        }

        // Check if PR Title is less than max length
        if (inputs.pr_title_max_length) {
          if (!validateMaxLength(pr_title, inputs.pr_title_max_length)) {
            core.setFailed(
              `Pull Request title "${pr_title}" is longer than max length of ${inputs.pr_title_max_length} characters`
            )
            return
          } else {
            core.info(
              `Pull Request title "${pr_title}" is less than max length of ${inputs.pr_title_max_length} characters`
            )
          }
        } else {
          core.debug(
            `Debug: No pull request title maximum length specified for validation`
          )
        }

        // Check if PR Title is greater than min length
        if (inputs.pr_title_min_length) {
          if (!validateMinLength(pr_title, inputs.pr_title_min_length)) {
            core.setFailed(
              `Pull Request title "${pr_title}" is less than min length of ${inputs.pr_title_min_length} characters`
            )
            return
          } else {
            core.info(
              `Pull Request title "${pr_title}" is longer than min length of ${inputs.pr_title_min_length} characters`
            )
          }
        } else {
          core.debug(
            `Debug: No pull request title minimum length specified for validation`
          )
        }
      }
    }

    if (inputs.check_commits) {
      core.debug('Fetching Pull Request Commits')
      const {data: commits} = await octokit.rest.pulls.listCommits(payload)
      const pr_commits = commits.map(commit => ({
        message: commit.commit.message,
        sha: commit.sha,
        author: commit.author?.login
      }))

      core.info(`Validating Pull Request commits`)

      if (pr_commits.length > 0) {
        pr_commits.map(commit => {
          // Check if PR title passes regex
          if (inputs.commit_message_regex) {
            if (!validateRegex(commit.message, inputs.commit_message_regex)) {
              core.setFailed(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" failed regex check -> ${inputs.commit_message_regex}`
              )
              return
            } else {
              core.info(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" passed regex check -> ${inputs.commit_message_regex}`
              )
            }
          } else {
            core.debug(
              `Debug: No commit regular expression specified for validation`
            )
          }

          // Check if commit starts with prefix
          if (inputs.commit_message_prefix) {
            if (!validatePrefix(commit.message, inputs.commit_message_prefix)) {
              core.setFailed(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" does not start with ${inputs.commit_message_prefix}`
              )
              return
            } else {
              core.info(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" starts with "${inputs.commit_message_prefix}"`
              )
            }
          } else {
            core.debug(`Debug: No commit prefix specified for validation`)
          }

          // Check if commit is less than max length
          if (inputs.commit_max_length) {
            if (!validateMaxLength(commit.message, inputs.commit_max_length)) {
              core.setFailed(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" is longer than max length of ${
                  inputs.commit_max_length
                } characters`
              )
              return
            } else {
              core.info(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" is less than max length of ${
                  inputs.commit_max_length
                } characters`
              )
            }
          } else {
            core.debug(
              `Debug: No commit maximum length specified for validation`
            )
          }

          // Check if commit is greater than min length
          if (inputs.commit_min_length) {
            if (!validateMinLength(commit.message, inputs.commit_min_length)) {
              core.setFailed(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" is less than min length of ${
                  inputs.commit_min_length
                } characters`
              )
              return
            } else {
              core.info(
                `"${commit.sha.substring(0, 7)}: ${
                  commit.message
                }" is longer than min length of ${
                  inputs.commit_min_length
                } characters`
              )
            }
          } else {
            core.debug(
              `Debug: No commit minimum length specified for validation`
            )
          }
        })
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

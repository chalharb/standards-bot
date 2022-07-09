import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  validateRegex,
  validatePrefix,
  validateMaxLength,
  validateMinLength
} from './functions'

async function run(): Promise<void> {
  try {
    core.debug('Standards Bot Starting Analysis')
    const validEvents = ['pull_request']

    core.debug('Checking if the event is a pull request')
    const event = github.context.eventName
    if (!validEvents.includes(event)) {
      core.setFailed(`Invalid event: ${event}`)
      return
    }

    core.debug('Fetching input parameters')
    const authToken = core.getInput('github-token')
    const pr_title_regex = core.getInput('pr-title-regex')
    const pr_title_prefix = core.getInput('pr-title-prefix')
    const pr_title_min_length = parseInt(core.getInput('pr-title-min-length'))
    const pr_title_max_length = parseInt(core.getInput('pr-title-max-length'))
    const commit_message_regex = core.getInput('commit-message-regex')

    const owner = github.context.payload.pull_request?.base.user.login
    const repo = github.context.payload.pull_request?.base.repo.name
    const pr_number = github.context.payload.pull_request?.number as number
    const octokit = github.getOctokit(authToken)

    core.debug('Setting payload')
    const payload = {
      owner,
      repo,
      pull_number: pr_number
    }

    core.debug('Fetching Pull Request Data')
    const {data: pullRequestData} = await octokit.rest.pulls.get(payload)

    core.debug('Fetching Pull Request Commits')
    const {data: commits} = await octokit.rest.pulls.listCommits(payload)

    const pr_title = pullRequestData.title
    const pr_commits = commits.map(commit => ({
      message: commit.commit.message,
      sha: commit.sha,
      author: commit.author?.login
    }))

    core.info(`Validating Pull Request title`)
    // Check if PR title passes regex
    if (pr_title_regex) {
      if (!validateRegex(pr_title, pr_title_regex)) {
        core.setFailed(
          `Pull Request title "${pr_title}" failed to pass match regex - ${RegExp(
            pr_title_regex
          )}`
        )
        return
      } else {
        core.info(
          `Pull Request title "${pr_title}" passed regex - ${pr_title_regex}`
        )
      }
    } else {
      core.info(
        `Info: No Pull Request title regular expression specified for validation`
      )
    }

    // Check if PR title starts with prefix
    if (pr_title_prefix) {
      if (!validatePrefix(pr_title, pr_title_prefix)) {
        core.setFailed(
          `Pull Request title "${pr_title}" is does not start with ${pr_title_prefix}`
        )
        return
      } else {
        core.info(
          `Pull Request title "${pr_title}" starts with ${pr_title_prefix}`
        )
      }
    } else {
      core.info(`Info: No pull request title prefix specified for validation`)
    }

    // Check if PR Title is less than max length
    if (pr_title_max_length) {
      if (!validateMaxLength(pr_title, pr_title_max_length)) {
        core.setFailed(
          `Pull Request title "${pr_title}" is longer than max length of ${pr_title_max_length} characters`
        )
        return
      } else {
        core.info(
          `Pull Request title "${pr_title}" is less than max length of ${pr_title_max_length} characters`
        )
      }
    } else {
      core.info(
        `Info: No pull request title maximum length specified for validation`
      )
    }

    // Check if PR Title is greater than min length
    if (pr_title_min_length) {
      if (!validateMinLength(pr_title, pr_title_min_length)) {
        core.setFailed(
          `Pull Request title "${pr_title}" is less than min length of ${pr_title_min_length} characters`
        )
        return
      } else {
        core.info(
          `Pull Request title "${pr_title}" is longer than min length of ${pr_title_min_length} characters`
        )
      }
    } else {
      core.info(
        `Info: No pull request title minimum length specified for validation`
      )
    }

    if (commit_message_regex) {
      core.info(`\n -------------------------------------------------------\n`)
      core.info(`Validating Pull Request commits`)
    }

    if (commit_message_regex) {
      pr_commits.map(commit => {
        if (!validateRegex(commit.message, commit_message_regex)) {
          core.setFailed(
            `"${commit.sha.substring(0, 7)}: ${
              commit.message
            }" failed regex check -> ${commit_message_regex}`
          )
          return
        } else {
          core.info(
            `"${commit.sha.substring(0, 7)}: ${
              commit.message
            }" passed regex check -> ${commit_message_regex}`
          )
        }
      })
    } else {
      core.info(`Info: No commit regular expression specified for validation`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

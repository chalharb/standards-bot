import * as core from '@actions/core'
import * as github from '@actions/github'
import styles from 'ansi-styles'
import {
  validateRegex,
  validatePrefix,
  validateMaxLength,
  validateMinLength
} from './functions'

import {PullRequestData} from './types'

function cyanText(text: string): string {
  return `${styles.cyan.open}${text}${styles.cyan.close}`
}

function greenText(text: string): string {
  return `${styles.green.open}${text}${styles.green.close}`
}

function yellowText(text: string): string {
  return `${styles.yellow.open}${text}${styles.yellow.close}`
}

async function run(): Promise<void> {
  try {
    core.debug('Standards Bot Starting Analysis')
    const validEvents = ['pull_request']

    // Check if event is a pull request to fail early
    core.debug('Checking if the event is a pull request')
    if (!validEvents.includes(github.context.eventName)) {
      core.setFailed(`Invalid Event: ${github.context.eventName}`)
      return
    }

    const pullRequestPayload = github.context.payload.pull_request

    const pullRequestData: PullRequestData = {
      owner: pullRequestPayload?.base.user.login,
      repo: pullRequestPayload?.base.repo.name,
      pull_number: pullRequestPayload?.number as number
    }

    core.debug('Fetching input parameters')
    const inputs = {
      authToken: core.getInput('github-token'),
      prTitleRegExp: core.getInput('pr-title-regex') || undefined,
      prTitlePrefix: core.getInput('pr-title-prefix') || undefined,
      prTitleMinLength:
        parseInt(core.getInput('pr-title-min-length')) || undefined,
      prTitleMaxLength:
        parseInt(core.getInput('pr-title-max-length')) || undefined,
      commitMessageRegExp: core.getInput('commit-message-regex') || undefined,
      commitMessagePrefix: core.getInput('commit-message-prefix') || undefined,
      commitMessageMinLength:
        parseInt(core.getInput('commit-min-length')) || undefined,
      commitMessageMaxLength:
        parseInt(core.getInput('commit-max-length')) || undefined
    }

    // Check if an auth token is provided to fail early
    if (!inputs.authToken) {
      core.setFailed('Exiting: No GitHub Token provided')
      return
    }

    const octokit = github.getOctokit(inputs.authToken)

    core.debug('Fetching Pull Request Data')
    const {data} = await octokit.rest.pulls.get({
      ...pullRequestData
    })

    core.info(cyanText(`Validating Pull Request Title -> ${data.title}`))
    // Check if a pull request title matches the provied Regular Expression
    inputs.prTitleRegExp
      ? !validateRegex(data.title, inputs.prTitleRegExp)
        ? core.setFailed('Pull Request Title RegExp - Failed')
        : core.info(greenText('- Pull Request Title RegExp - Passed'))
      : core.debug(yellowText('Pull Request Title RegExp - Skipped'))

    // Check if a pull request title starts with the provided prefix
    inputs.prTitlePrefix
      ? !validatePrefix(data.title, inputs.prTitlePrefix)
        ? core.setFailed('Pull Request Title RegExp - Failed')
        : core.info(greenText('- Pull Request Title Prefix - Passed'))
      : core.debug(yellowText('Pull Request Title Prefix - Skipped'))

    // Check if a pull request title is greater than the provided min length
    inputs.prTitleMinLength
      ? !validateMinLength(data.title, inputs.prTitleMinLength)
        ? core.setFailed('Pull Request Title Min Length - Failed')
        : core.info(greenText('- Pull Request Title Min Length - Passed'))
      : core.debug(yellowText('Pull Request Title Min Length - Skipped'))

    // Check if a pull request title is less than the provided max length
    inputs.prTitleMaxLength
      ? !validateMaxLength(data.title, inputs.prTitleMaxLength)
        ? core.setFailed('Pull Request Title Max Length - Failed')
        : core.info(greenText('- Pull Request Title Max Length - Passed'))
      : core.debug(yellowText('Pull Request Title Max Length - Skipped'))

    core.debug('Fetching Commit Data')
    const {data: commits} = await octokit.rest.pulls.listCommits({
      ...pullRequestData
    })

    core.debug('Generating commit message array')
    // Generate an array of commits
    const allPullRequestCommits = commits.map(commit => ({
      message: commit.commit.message,
      sha: commit.sha.substring(0, 7),
      author: commit.author?.login
    }))

    if (allPullRequestCommits.length > 0) {
      allPullRequestCommits.map(commit => {
        core.info(
          cyanText(
            `Validating Commit Message -> ${commit.sha} ${commit.message}`
          )
        )
        // Check if commit message matches the provied regular expression
        inputs.commitMessageRegExp
          ? !validateRegex(commit.message, inputs.commitMessageRegExp)
            ? core.setFailed('Commit Message RegExp - Failed')
            : core.info(greenText('- Commit Message RegExp - Passed'))
          : core.debug(yellowText('Commit Message RegExp - Skipped'))

        // Check if commit message matches the provied prefix
        inputs.commitMessagePrefix
          ? !validatePrefix(commit.message, inputs.commitMessagePrefix)
            ? core.setFailed('Commit Message Prefix - Failed')
            : core.info(greenText('- Commit Message Prefix - Passed'))
          : core.debug(yellowText('Commit Message Prefix - Skipped'))

        // Check if commit message is greater than the provided min length
        inputs.commitMessageMinLength
          ? !validateMinLength(commit.message, inputs.commitMessageMinLength)
            ? core.setFailed('Commit Message Min Length - Failed')
            : core.info(greenText('- Commit Message Min Length - Passed'))
          : core.debug(yellowText('Commit Message Min Length - Skipped'))

        // Check if commit message is less than the provided max length
        inputs.commitMessageMaxLength
          ? !validateMinLength(commit.message, inputs.commitMessageMaxLength)
            ? core.setFailed('Commit Message Max Length - Failed')
            : core.info(greenText('- Commit Message Max Length - Passed'))
          : core.debug(yellowText('Commit Message Max Length - Skipped'))
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

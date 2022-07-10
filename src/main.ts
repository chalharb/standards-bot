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

function boldText(text: string): string {
  return `${styles.bold.open}${text}${styles.bold.close}`
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

    core.info(cyanText(boldText('Validating Pull Request Title')))
    core.info('---------------------------------------------------------------')
    // Check if a pull request title matches the provied Regular Expression
    inputs.prTitleRegExp
      ? !validateRegex(data.title, inputs.prTitleRegExp)
        ? core.setFailed(`PR title failed regex - ${inputs.prTitleRegExp}`)
        : core.info(
            greenText(`PR title passed regex - ${inputs.prTitleRegExp}`)
          )
      : core.info(
          yellowText('Skipping: No PR title regular expression provided')
        )

    // Check if a pull request title starts with the provided prefix
    inputs.prTitlePrefix
      ? !validatePrefix(data.title, inputs.prTitlePrefix)
        ? core.setFailed(`PR title failed prefix - ${inputs.prTitleRegExp}`)
        : core.info(
            greenText(`PR title passed prefix - ${inputs.prTitleRegExp}`)
          )
      : core.info(yellowText('Skipping: No PR title prefix provided'))

    // Check if a pull request title is greater than the provided min length
    inputs.prTitleMinLength
      ? !validateMinLength(data.title, inputs.prTitleMinLength)
        ? core.setFailed(`PR title failed min length - ${inputs.prTitleRegExp}`)
        : core.info(
            greenText(`PR title passed min length - ${inputs.prTitleRegExp}`)
          )
      : core.info(yellowText('Skipping: No PR title min length provided'))

    // Check if a pull request title is less than the provided max length
    inputs.prTitleMaxLength
      ? !validateMaxLength(data.title, inputs.prTitleMaxLength)
        ? core.setFailed(`PR title failed max length - ${inputs.prTitleRegExp}`)
        : core.info(
            greenText(`PR title passed max length - ${inputs.prTitleRegExp}`)
          )
      : core.info(yellowText('Skipping: No PR title max length provided'))

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

    core.info('')
    core.info(cyanText(boldText('Validating Commit Messages')))
    core.info('---------------------------------------------------------------')
    if (allPullRequestCommits.length > 0) {
      allPullRequestCommits.map(commit => {
        core.info(`Validating commit: ${commit.sha} ${commit.message}`)
        // Check if commit message matches the provied regular expression
        inputs.commitMessageRegExp
          ? !validateRegex(commit.message, inputs.commitMessageRegExp)
            ? core.setFailed(
                `Commit message failed regex - ${inputs.commitMessageRegExp}`
              )
            : core.info(
                greenText(
                  `Commit message passed regex - ${inputs.commitMessageRegExp}`
                )
              )
          : core.info(
              yellowText(
                '- Skipping: No commit message regular expression provided'
              )
            )

        // Check if commit message matches the provied prefix
        inputs.commitMessagePrefix
          ? !validatePrefix(commit.message, inputs.commitMessagePrefix)
            ? core.setFailed(
                `Commit message failed prefix - ${inputs.commitMessageRegExp}`
              )
            : core.info(
                greenText(
                  `Commit message passed prefix - ${inputs.commitMessageRegExp}`
                )
              )
          : core.info(
              yellowText('- Skipping: No commit message prefix provided')
            )

        // Check if commit message is greater than the provided min length
        inputs.commitMessageMinLength
          ? !validateMinLength(commit.message, inputs.commitMessageMinLength)
            ? core.setFailed(
                `Commit message failed min length - ${inputs.commitMessageRegExp}`
              )
            : core.info(
                greenText(
                  `Commit message passed min length - ${inputs.commitMessageRegExp}`
                )
              )
          : core.info(
              yellowText('- Skipping: No commit message min length provided')
            )

        // Check if commit message is less than the provided max length
        inputs.commitMessageMaxLength
          ? !validateMinLength(commit.message, inputs.commitMessageMaxLength)
            ? core.setFailed(
                `Commit message failed max length - ${inputs.commitMessageRegExp}`
              )
            : core.info(
                greenText(
                  `Commit message passed max length - ${inputs.commitMessageRegExp}`
                )
              )
          : core.info(
              yellowText('- Skipping: No commit message max length provided')
            )
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

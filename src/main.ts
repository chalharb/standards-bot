import * as core from '@actions/core'
import * as github from '@actions/github'

import {
  validateRegex,
  validatePrefix,
  validateMaxLength,
  validateMinLength,
  setStatusObject
} from './functions'

import {PullRequestData} from './types'

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
        parseInt(core.getInput('commit-message-min-length')) || undefined,
      commitMessageMaxLength:
        parseInt(core.getInput('commit-message-max-length')) || undefined
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

    // Regex
    let msg = 'Pull Request Title RegExp:'
    const prTitleRegExpStatus = inputs.prTitleRegExp
      ? !validateRegex(data.title, inputs.prTitleRegExp)
        ? setStatusObject(false, `${msg} Failed`)
        : setStatusObject(true, `${msg} Passed`)
      : setStatusObject(false, `${msg} Skipped`)

    // Prefix
    msg = 'Pull Request Title Prefix:'
    const prTitlePrefixStatus = inputs.prTitlePrefix
      ? !validatePrefix(data.title, inputs.prTitlePrefix)
        ? setStatusObject(false, `${msg} Failed`)
        : setStatusObject(true, `${msg} Passed`)
      : setStatusObject(false, `${msg} Skipped`)

    // Min Length
    msg = 'Pull Request Title Min Length:'
    const prTitleMinLenStatus = inputs.prTitleMinLength
      ? !validateMinLength(data.title, inputs.prTitleMinLength)
        ? setStatusObject(false, `${msg} Failed`)
        : setStatusObject(true, `${msg} Passed`)
      : setStatusObject(false, `${msg} Skipped`)

    // Max Length
    msg = 'Pull Request Title Max Length:'
    const prTitleMaxLenStatus = inputs.prTitleMaxLength
      ? !validateMaxLength(data.title, inputs.prTitleMaxLength)
        ? setStatusObject(false, `${msg} Failed`)
        : setStatusObject(true, `${msg} Passed`)
      : setStatusObject(false, `${msg} Skipped`)

    let status = {
      prTitleRegExpStatus,
      prTitlePrefixStatus,
      prTitleMinLenStatus,
      prTitleMaxLenStatus
    }

    console.log(JSON.stringify(status))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

import * as core from '@actions/core'
import * as github from '@actions/github'
import {validateRegex} from './functions'

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

    const {data: pullRequestData} = await octokit.rest.pulls.get(payload)
    const pr_title = pullRequestData.title

    core.info(`Validating Pull Request title`)
    // Check if PR title passes regex
    if (!validateRegex(pr_title, RegExp(pr_title_regex))) {
      core.setFailed(
        `Pull Request title "${pr_title}" failed to pass match regex - ${RegExp(
          pr_title_regex
        )}`
      )
      return
    } else {
      core.info(
        `Pull Request title "${pr_title}" passed regex - ${RegExp(
          pr_title_regex
        )}`
      )
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

import * as core from '@actions/core'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const fileName = core.getInput('file')
    const prefix = core.getInput('prefix')

    //Read the file name in the repository:
    core.info(`Reading file ${fileName}...`)
    const fs = require('fs')
    const data = fs.readFileSync(fileName, 'utf8')
    const lines = data.split('\n')
    core.info(`File ${fileName} read successfully!`)

    const prefixLineIndex = lines.findIndex((line) => line.startsWith(prefix))
    if (prefixLineIndex === -1) {
      core.setFailed(`Prefix ${prefix} not found in file ${fileName}`)
      return
    }

    //Access git to determine the git history:
    core.info('Accessing git history...')

    //We need to invoke the git cli to get the git history:
    const { execSync } = require('child_process')
    //Command format:git log --pretty=format:%H -L<line>,<line>:<file> -s -1
    const command = `git log --pretty=format:%H -L${prefixLineIndex + 1},${prefixLineIndex + 1}:${fileName} -s -1`
    const lastModifiedHash = execSync(command).toString().trim()

    core.info(`Git history accessed successfully!`)
    core.info(`Last modified commit hash: ${lastModifiedHash}`)

    //Count the commits between the last modified commit and the current commit:
    core.info('Counting commits...')
    const currentHash = execSync('git rev-parse HEAD').toString().trim()
    const commitCount = execSync(
      `git rev-list --count ${lastModifiedHash}..${currentHash}`
    )
      .toString()
      .trim()

    core.info(`Commit count: ${commitCount}`)

    //Set the output variable:
    core.setOutput('count', commitCount)
  } catch (e) {
    if (e instanceof Error) {
      core.setFailed(e.message)
    }
  }
}

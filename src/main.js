import * as core from '@actions/core'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { path } from 'path'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const prefix = core.getInput('prefix')
    const workingDirectory = core.getInput('working-directory')
    const fileInput = core.getInput('file')
    const fileName = path.join(workingDirectory, fileInput)

    //Read the file name in the repository:
    core.info(`Reading file ${fileName}...`)
    const data = fs.readFileSync(fileName, 'utf8')
    core.debug(`File data: ${data}`)
    const lines = data.split('\n')
    core.info(`File ${fileName} read successfully!`)

    const prefixLineIndex = lines.findIndex((line) => line.startsWith(prefix))
    if (prefixLineIndex === -1) {
      core.setFailed(`Prefix ${prefix} not found in file ${fileName}`)
      return
    }
    core.info(`Prefix ${prefix} found in line ${prefixLineIndex + 1}`)

    //Access git to determine the git history:
    core.info('Accessing git history...')

    //Command format:git log --pretty=format:%H -L<line>,<line>:<file> -s -1
    const command = `git log --pretty=format:%H -L${prefixLineIndex + 1},${prefixLineIndex + 1}:${fileName} -s -1`
    core.debug(`Executing command: ${command}`)
    const lastModifiedHash = execSync(command, {
      cwd: workingDirectory
    })
      .toString()
      .trim()

    core.info(`Git history accessed successfully!`)
    core.info(`Last modified commit hash: ${lastModifiedHash}`)

    //Count the commits between the last modified commit and the current commit:
    core.info('Counting commits...')
    const currentHash = execSync('git rev-parse HEAD', {
      cwd: workingDirectory
    })
      .toString()
      .trim()
    core.info(`Current commit hash: ${currentHash}`)
    core.debug(`Last modified commit hash: ${lastModifiedHash}`)
    core.debug(
      `Executing command: git rev-list --count ${lastModifiedHash}..${currentHash}`
    )
    const commitCount = execSync(
      `git rev-list --count ${lastModifiedHash}..${currentHash}`,
      {
        cwd: workingDirectory
      }
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

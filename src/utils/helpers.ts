/**
 * Extracts a pull request number from a commit message
 * Looks for patterns like "Merge pull request #123" or "(#123)" or simply "#123"
 * @param message The commit message to extract PR number from
 * @returns The PR number as a string, or undefined if no PR number was found
 */
export function extractPullRequestNumber(message: string): string | undefined {
  // Handle invalid input
  if (!message || typeof message !== 'string') {
    return undefined;
  }

  // These patterns match common PR references in commit messages:
  // 1. "Merge pull request #123 from branch" - GitHub merge commits
  // 2. "(#123)" - Common conventional commit reference to PR
  // 3. "#123" - Direct PR reference anywhere in the message
  const prPatterns = [/Merge pull request #(\d+)/i, /\(#(\d+)\)/, /#(\d+)\b/];

  for (const pattern of prPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

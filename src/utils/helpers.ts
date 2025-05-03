/**
 * Extracts a pull request number from a commit message
 * Looks for patterns like "Merge pull request #123" or "(#123)" or simply "#123"
 */
export function extractPullRequestNumber(message: string): string | undefined {
  const prPatterns = [/Merge pull request #(\d+)/i, /\(#(\d+)\)/, /#(\d+)\b/];

  for (const pattern of prPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

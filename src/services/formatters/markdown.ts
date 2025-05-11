import { Commit } from '../../models/commit';
import { Formatter } from './interface';

interface CommitCategory {
  id: string;
  name: string;
  emoji: string;
  regex: RegExp;
  order: number;
}

interface CommitsByDay {
  [date: string]: Commit[];
}

interface CommitsByCategory {
  [categoryId: string]: {
    emoji: string;
    name: string;
    order: number;
    commits: Commit[];
  };
}

export class MarkdownFormatter implements Formatter {
  private readonly commitCategories: CommitCategory[] = [
    {
      id: 'feat',
      name: 'Feature',
      emoji: '✨',
      regex: /^feat(\([^)]+\))?!?:/i,
      order: 1,
    },
    {
      id: 'fix',
      name: 'Bug Fix',
      emoji: '🐛',
      regex: /^fix(\([^)]+\))?!?:/i,
      order: 2,
    },
    {
      id: 'docs',
      name: 'Documentation',
      emoji: '📚',
      regex: /^docs(\([^)]+\))?!?:/i,
      order: 3,
    },
    {
      id: 'refactor',
      name: 'Refactor',
      emoji: '♻️',
      regex: /^refactor(\([^)]+\))?!?:/i,
      order: 4,
    },
    {
      id: 'test',
      name: 'Test',
      emoji: '🧪',
      regex: /^test(\([^)]+\))?!?:/i,
      order: 5,
    },
    {
      id: 'build',
      name: 'Build',
      emoji: '🏗️',
      regex: /^build(\([^)]+\))?!?:/i,
      order: 6,
    },
    {
      id: 'chore',
      name: 'Chore',
      emoji: '🔧',
      regex: /^chore(\([^)]+\))?!?:/i,
      order: 7,
    },
    {
      id: 'style',
      name: 'Style',
      emoji: '🎨',
      regex: /^style(\([^)]+\))?!?:/i,
      order: 8,
    },
    {
      id: 'perf',
      name: 'Performance',
      emoji: '⚡',
      regex: /^perf(\([^)]+\))?!?:/i,
      order: 9,
    },
    {
      id: 'breaking',
      name: 'Breaking Change',
      emoji: '🔥',
      regex: /^[a-z]+(\([^)]+\))?!:|.*?BREAKING CHANGE:/i,
      order: 0,
    },
    {
      id: 'other',
      name: 'Other',
      emoji: '📦',
      regex: /^.*/i,
      order: 999,
    },
  ];

  format(commits: Commit[]): string {
    if (!commits || commits.length === 0) {
      return '# No commits found';
    }

    const commitsByDay = this.groupCommitsByDay(commits);
    let markdown = '# Comistory\n\n> Every commit tells a story\n\n';

    // Newest first
    const sortedDays = Object.keys(commitsByDay).sort().reverse();

    for (const day of sortedDays) {
      const dayCommits = commitsByDay[day] || [];
      const commitsByCategory = this.groupCommitsByCategory(dayCommits);

      markdown += `## ${day}\n\n`;

      const sortedCategories = Object.keys(commitsByCategory)
        .map((key) => {
          const category = commitsByCategory[key];
          return category ? category : null;
        })
        .filter(
          (category): category is NonNullable<typeof category> =>
            category !== null,
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      for (const category of sortedCategories) {
        markdown += `### ${category.emoji} ${category.name}\n\n`;

        for (const commit of category.commits) {
          const commitLine = this.formatCommitLine(commit);
          markdown += `- ${commitLine}\n`;
        }

        markdown += '\n';
      }
    }

    return markdown.trim();
  }

  private groupCommitsByDay(commits: Commit[]): CommitsByDay {
    const result: CommitsByDay = {};

    for (const commit of commits) {
      const date = commit.date;
      let dateKey = 'Undated';

      if (date && !isNaN(date.getTime())) {
        dateKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      } else if (
        typeof commit.message === 'string' &&
        commit.message.includes('20')
      ) {
        const dateMatch = commit.message.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          dateKey = dateMatch[0].replace(/-/g, '/');
        }
      }

      if (!result[dateKey]) {
        result[dateKey] = [];
      }

      // It should definitely exist
      const commits = result[dateKey];
      if (commits) {
        commits.push(commit);
      }
    }

    return result;
  }

  private groupCommitsByCategory(commits: Commit[]): CommitsByCategory {
    const result: CommitsByCategory = {};

    for (const commit of commits) {
      const category = this.classifyCommit(commit.message || '');

      if (!result[category.id]) {
        result[category.id] = {
          emoji: category.emoji,
          name: category.name,
          order: category.order,
          commits: [],
        };
      }

      // It should always exist
      const categoryData = result[category.id];
      if (categoryData) {
        categoryData.commits.push(commit);
      }
    }

    return result;
  }

  private getFallbackCategory(): CommitCategory {
    return {
      id: 'other',
      name: 'Other',
      emoji: '📦',
      regex: /.*/,
      order: 999,
    };
  }

  private classifyCommit(message: string): CommitCategory {
    // Ensure we have at least one category
    if (!this.commitCategories.length) {
      return this.getFallbackCategory();
    }

    if (
      message.includes('BREAKING CHANGE:') ||
      /^[a-z]+(\([^)]+\))?!:/i.test(message)
    ) {
      const breakingCategory = this.commitCategories.find(
        (c) => c.id === 'breaking',
      );
      if (breakingCategory) {
        return breakingCategory;
      }
      // Fallback if no breaking change category exists
      return this.commitCategories[0] || this.getFallbackCategory();
    }

    for (const category of this.commitCategories) {
      if (category && category.regex && category.regex.test(message)) {
        return category;
      }
    }

    const fallbackCategory =
      this.commitCategories[this.commitCategories.length - 1];
    if (fallbackCategory) {
      return fallbackCategory;
    }

    return this.getFallbackCategory();
  }

  private formatCommitLine(commit: Commit): string {
    if (!commit) {
      return 'Unnamed commit';
    }

    // Ensure message is a string, never undefined
    const message = typeof commit.message === 'string' ? commit.message : '';
    // Handle empty message case better
    if (!message.trim()) {
      return `Empty commit message (${commit.shortHash || 'unknown'})`;
    }

    // Get first line, ensure it's trimmed
    let firstLine = message.split('\n')[0].trim();

    if (firstLine.length > 100) {
      firstLine = firstLine.substring(0, 97) + '...';
    }

    let line = firstLine;
    const shortHash = commit.shortHash || '';

    // Add link to commit if repo URL is available
    if (commit.repoUrl && commit.hash) {
      // Ensure repoUrl doesn't end with a slash before adding /commit/
      const repoUrl = commit.repoUrl.endsWith('/')
        ? commit.repoUrl.slice(0, -1)
        : commit.repoUrl;
      const commitUrl = `${repoUrl}/commit/${commit.hash}`;
      line += ` ([${shortHash}](${commitUrl}))`;
    } else {
      // For local commits without URLs, add the short hash for reference
      line += ` (${shortHash})`;
    }

    // Add PR link if applicable
    if (commit.prNumber && commit.repoUrl) {
      // Ensure repoUrl doesn't end with a slash before adding /pull/
      const repoUrl = commit.repoUrl.endsWith('/')
        ? commit.repoUrl.slice(0, -1)
        : commit.repoUrl;
      const prUrl = `${repoUrl}/pull/${commit.prNumber}`;

      // More precise replacements to avoid unintended substitutions
      line = line.replace(
        `(#${commit.prNumber})`,
        `([#${commit.prNumber}](${prUrl}))`,
      );
      line = line.replace(
        ` #${commit.prNumber}`,
        ` [#${commit.prNumber}](${prUrl})`,
      );
    }

    return line;
  }
}

export const markdownFormatter = new MarkdownFormatter();

import { Commit } from '../../models/commit';

export interface Formatter {
  format(commits: Commit[]): string;
}

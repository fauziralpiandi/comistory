export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  date: Date;
  prNumber?: string;
  repoUrl?: string;
}

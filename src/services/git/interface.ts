import { Commit } from '../../models/commit';

export interface FetchOptions {
  perPage?: number;
  page?: number;
}

export interface GitProvider {
  fetchCommits(options: FetchOptions): Promise<Commit[]>;
}

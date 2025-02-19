import { configuration, DateStyle, TagSorting } from '../../configuration';
import { Container } from '../../container';
import { formatDate, fromNow } from '../../system/date';
import { memoize } from '../../system/decorators/memoize';
import { sortCompare } from '../../system/string';
import { GitReference, GitTagReference } from './reference';

export interface TagSortOptions {
	current?: boolean;
	orderBy?: TagSorting;
}

export class GitTag implements GitTagReference {
	static is(tag: any): tag is GitTag {
		return tag instanceof GitTag;
	}

	static isOfRefType(tag: GitReference | undefined) {
		return tag?.refType === 'tag';
	}

	static sort(tags: GitTag[], options?: TagSortOptions) {
		options = { orderBy: configuration.get('sortTagsBy'), ...options };

		switch (options.orderBy) {
			case TagSorting.DateAsc:
				return tags.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
			case TagSorting.NameAsc:
				return tags.sort((a, b) => sortCompare(a.name, b.name));
			case TagSorting.NameDesc:
				return tags.sort((a, b) => sortCompare(b.name, a.name));
			case TagSorting.DateDesc:
			default:
				return tags.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
		}
	}

	readonly refType = 'tag';

	constructor(
		public readonly repoPath: string,
		public readonly name: string,
		public readonly sha: string,
		public readonly message: string,
		public readonly date: Date | undefined,
		public readonly commitDate: Date | undefined,
	) {}

	get formattedDate(): string {
		return Container.instance.TagDateFormatting.dateStyle === DateStyle.Absolute
			? this.formatDate(Container.instance.TagDateFormatting.dateFormat)
			: this.formatDateFromNow();
	}

	get ref() {
		return this.name;
	}

	@memoize<GitTag['formatCommitDate']>(format => format ?? 'MMMM Do, YYYY h:mma')
	formatCommitDate(format?: string | null) {
		return this.commitDate != null ? formatDate(this.commitDate, format ?? 'MMMM Do, YYYY h:mma') : '';
	}

	formatCommitDateFromNow() {
		return this.commitDate != null ? fromNow(this.commitDate) : '';
	}

	@memoize<GitTag['formatDate']>(format => format ?? 'MMMM Do, YYYY h:mma')
	formatDate(format?: string | null) {
		return this.date != null ? formatDate(this.date, format ?? 'MMMM Do, YYYY h:mma') : '';
	}

	formatDateFromNow() {
		return this.date != null ? fromNow(this.date) : '';
	}

	@memoize()
	getBasename(): string {
		const index = this.name.lastIndexOf('/');
		return index !== -1 ? this.name.substring(index + 1) : this.name;
	}
}

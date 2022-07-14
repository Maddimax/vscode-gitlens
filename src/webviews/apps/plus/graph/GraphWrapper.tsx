import GraphContainer, {
	CssVariables,
	GraphRow,
	Head,
	Remote,
	Tag
} from '@axosoft/gitkraken-components/lib/components/graph/GraphContainer';
import React, { useEffect, useState } from 'react';
import {
	CommitListCallback,
	GitBranch,
	GitCommit,
	GitRemote,
	GitTag,
	GraphColumnConfig,
	Repository,
	State,
} from '../../../../plus/webviews/graph/protocol';

export interface GraphWrapperProps extends State {
	nonce?: string;
	subscriber: (callback: CommitListCallback) => () => void;
	onSelectRepository?: (repository: Repository) => void;
	onColumnChange?: (name: string, settings: GraphColumnConfig) => void;
	onMoreCommits?: (limit?: number) => void;
}

// Copied from original pushed code of Miggy E.
// TODO: review that code as I'm not sure if it is the correct way to do that in Gitlens side.
// I suppose we need to use the GitLens themes here instead.
export const getCssVariables = (): CssVariables => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    return {
        '--app__bg0': computedStyle.getPropertyValue('--color-background'),
        // note that we should probably do something theme-related here, (dark theme we lighten, light theme we darken)
        '--panel__bg0':computedStyle.getPropertyValue('--color-background--lighten-05'),
    };
};

const getGraphModel = (
	gitCommits: GitCommit[] = [],
	gitRemotes: GitRemote[] = [],
	gitTags: GitTag[] = [],
	gitBranches: GitBranch[] = []
): GraphRow[] => {
    const graphRows: GraphRow[] = [];

	// console.log('gitCommits -> ', gitCommits);
	// console.log('gitRemotes -> ', gitRemotes);
	// console.log('gitTags -> ', gitTags);
	// console.log('gitBranches -> ', gitBranches);

	// TODO: review if that code is correct and see if we need to add more data
	for (const gitCommit of gitCommits) {
		const graphRemotes: Remote[] = gitBranches.filter(
			(branch: GitBranch) => branch.sha === gitCommit.sha
		).map((branch: GitBranch) => {
			return {
				name: branch.name,
				url: branch.id
				// avatarUrl: // TODO:
			};
		});

		const graphHeads: Head[] = gitBranches.filter(
			(branch: GitBranch) => branch.sha === gitCommit.sha && branch.current
		).map((branch: GitBranch) => {
			return {
				name: branch.name,
				isCurrentHead: branch.current
			};
		});

		const graphTags: Tag[] = gitTags.filter(
			(tag: GitTag) => tag.sha === gitCommit.sha
		).map((tag: GitTag) => ({
			name: tag.name
			// annotated: tag.refType === 'annotatedTag' // TODO: review that. I have copied same logic of GK but I think this is not correct.
		}));

		graphRows.push({
			sha: gitCommit.sha,
			parents: gitCommit.parents,
			author: gitCommit.author.name,
			email: gitCommit.author.email,
			date: new Date(gitCommit.committer.date).getTime(),
			message: gitCommit.message,
			type: 'commit-node', // TODO: review logic for stash, wip, etc
			heads: graphHeads,
			remotes: graphRemotes,
			tags: graphTags
		});
	}

    return graphRows;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function GraphWrapper({
	subscriber,
	commits = [],
	repositories = [],
	remotes = [],
	tags = [],
	branches = [],
	selectedRepository,
	config,
	log,
	onSelectRepository,
	onColumnChange,
	onMoreCommits,
	nonce
}: GraphWrapperProps) {
	const [graphList, setGraphList] = useState(getGraphModel(commits, remotes, tags, branches));
	const [reposList, setReposList] = useState(repositories);
	const [currentRepository, setCurrentRepository] = useState(selectedRepository);
	const [settings, setSettings] = useState(config);
	const [logState, setLogState] = useState(log);
	const [isLoading, setIsLoading] = useState(false);
  const graphWidthOffset = 20;
  const graphHeightOffset = 100;
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight - graphHeightOffset,
    width: window.innerWidth - graphWidthOffset
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight - graphHeightOffset,
        width: window.innerWidth - graphWidthOffset
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

	function transformData(state: State) {
		setGraphList(getGraphModel(state.commits, state.remotes, state.tags, state.branches));
		setReposList(state.repositories ?? []);
		setCurrentRepository(state.selectedRepository);
		setSettings(state.config);
		setLogState(state.log);
		setIsLoading(false);
	}

	useEffect(() => {
		if (subscriber === undefined) {
			return;
		}
		return subscriber(transformData);
	}, []);

	const handleSelectRepository = (item: GitCommit) => {
		if (onSelectRepository !== undefined) {
			onSelectRepository(item);
		}
	};

	const handleMoreCommits = () => {
		setIsLoading(true);
		onMoreCommits?.();
	};

	return (
		<>
			<ul>
				{reposList.length ? (
					reposList.map((item, index) => (
						<li onClick={() => handleSelectRepository(item)} key={`repos-${index}`}>
							{item.path === currentRepository ? '(selected)' : ''}
							{JSON.stringify(item)}
						</li>
					))
				) : (
					<li>No repos</li>
				)}
			</ul>
			{currentRepository !== undefined ? (
				<>
					<h2>Repository: {currentRepository}</h2>
					<GraphContainer
						cssVariables={getCssVariables()}
						graphRows={graphList}
            height={dimensions.height}
						hasMoreCommits={logState?.hasMore}
						isLoadingRows={isLoading}
						nonce={nonce}
						onShowMoreCommitsClicked={handleMoreCommits}
            width={dimensions.width}
					/>
				</>
			) : (
				<p>No repository is selected</p>
			)}
		</>
	);
}

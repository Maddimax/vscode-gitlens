import { commands, Command as CoreCommand, Disposable, Uri } from 'vscode';
import { Action, ActionContext } from '../api/gitlens';
import type { Command } from '../commands/base';
import { Commands, CoreCommands, CoreGitCommands } from '../constants';
import type { Container } from '../container';

interface CommandConstructor {
	new (container: Container): Command;
}
const registrableCommands: CommandConstructor[] = [];

export function command(): ClassDecorator {
	return (target: any) => {
		registrableCommands.push(target);
	};
}

export function registerCommands(container: Container): Disposable[] {
	return registrableCommands.map(c => new c(container));
}

export function asCommand<T extends unknown[]>(
	command: Omit<CoreCommand, 'arguments'> & { arguments: [...T] },
): CoreCommand {
	return command;
}

export function executeActionCommand<T extends ActionContext>(action: Action<T>, args: Omit<T, 'type'>) {
	return commands.executeCommand(`${Commands.ActionPrefix}${action}`, { ...args, type: action });
}

type SupportedCommands = Commands | `gitlens.views.${string}.focus` | `gitlens.views.${string}.resetViewLocation`;

export function executeCommand<U = any>(command: SupportedCommands): Thenable<U>;
export function executeCommand<T = unknown, U = any>(command: SupportedCommands, arg: T): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(
	command: SupportedCommands,
	...args: T
): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(
	command: SupportedCommands,
	...args: T
): Thenable<U> {
	return commands.executeCommand<U>(command, ...args);
}

export function executeCoreCommand<T = unknown, U = any>(command: CoreCommands, arg: T): Thenable<U>;
export function executeCoreCommand<T extends [...unknown[]] = [], U = any>(
	command: CoreCommands,
	...args: T
): Thenable<U>;
export function executeCoreCommand<T extends [...unknown[]] = [], U = any>(
	command: CoreCommands,
	...args: T
): Thenable<U> {
	return commands.executeCommand<U>(command, ...args);
}

export function executeCoreGitCommand<U = any>(command: CoreGitCommands): Thenable<U>;
export function executeCoreGitCommand<T = unknown, U = any>(command: CoreGitCommands, arg: T): Thenable<U>;
export function executeCoreGitCommand<T extends [...unknown[]] = [], U = any>(
	command: CoreGitCommands,
	...args: T
): Thenable<U>;
export function executeCoreGitCommand<T extends [...unknown[]] = [], U = any>(
	command: CoreGitCommands,
	...args: T
): Thenable<U> {
	return commands.executeCommand<U>(command, ...args);
}

export function executeEditorCommand<T>(command: Commands, uri: Uri | undefined, args: T) {
	return commands.executeCommand(command, uri, args);
}

//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.gcloud {
	export namespace cli {
		export interface Invocation {
			command: string
			arguments: string[]
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation
			result?: (json: any) => R
		}

		export type Executor = <P,R>(command: cli.Command<P,R>) => {
			argument: (p: P) => {
				run: slime.$api.fp.impure.Ask<{
					console: string
				},R>
			}
		}

		export interface Project {
			command: cli.Executor
		}

		export interface Account {
			project: (project: string) => Project
			command: cli.Executor
		}

		export interface Installation {
			account: (account: string) => Account
			command: cli.Executor
		}
	}

	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Exports {
		cli: {
			Installation: {
				at: (pathname: string) => {
					account: (account: string) => {
						project: (project: string) => {
							command: cli.Executor
						}
						command: cli.Executor
					}
					command: cli.Executor
				}
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}
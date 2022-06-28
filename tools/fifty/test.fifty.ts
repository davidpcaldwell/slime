//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.test.internal {
	export interface Scope {
		success: boolean

		depth(): number
		fail(): void

		start: (name: string) => void
		test: slime.definition.verify.Context
		end: (name: string, result: boolean) => void
	}

	export type run = slime.fifty.test.internal.test.Exports["run"]
}

namespace slime.fifty.test.internal.test {
	export interface Context {
		library: {
			Verify: slime.definition.verify.Export
		}
		console: slime.fifty.test.internal.Console

		promises?: slime.definition.test.promises.Export
	}

	export type Result = {
		then: (f: (success: boolean) => any) => any
	}

	export interface Manifest {
		test: boolean
		children: {
			[x: string]: Manifest
		}
	}

	export interface AsynchronousScope {
		start: () => void
		then: (v: any) => any
		child: () => AsynchronousScope
		wait: () => Promise<any>
		now: () => Promise<any>

		test: {
			log: (...a: any[]) => void
			depth: () => number
			setName: (value: string) => void
		}
	}

	export interface AsynchronousScopes {
		push: () => AsynchronousScope
		pop: () => void
		current: () => AsynchronousScope
	}

	/**
	 * Executes a Fifty page at the given path from the given loader, optionally limiting the test to a single part.
	 */
	export interface Exports {
		run: (
			loader: slime.Loader,
			scopes: {
				jsh?: {
					directory: slime.jrunscript.file.Directory
					loader: slime.Loader
				}
			},
			path: string,
			part?: string
		) => Result

		list: (
			loader: slime.Loader,
			scopes: {
				jsh?: {
					directory: slime.jrunscript.file.Directory
					loader: slime.Loader
				}
			},
			path: string
		) => Manifest
	}

	export type Script = slime.loader.Script<Context,Exports>
}

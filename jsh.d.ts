//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * `jsh` is a shell environment which allows JavaScript programs to be written which execute in the Java virtual machine and thus
 * can interact with Java platform classes and libraries written in Java or other JVM languages.
 *
 * `jsh` scripts have access to the global `jsh` object, which is of type {@link Global}.
 *
 * See [running `jsh`](../src/jsh/launcher/api.html) for information about how to run scripts using `jsh` and configure the
 * shell.
 *
 * See [old JSAPI-based `jsh` documentation](../src/jsh/etc/api.html).
 */
namespace slime.jsh {
	namespace db.jdbc {
		interface Exports {
			//	interface is built out via Declaration Merging (https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
		}
	}

	export interface Tools {
		git: slime.jrunscript.git.Exports
		hg: any
		node: slime.jrunscript.node.Exports
		install: slime.jrunscript.tools.install.Exports
		github: slime.jrunscript.tools.github.Exports
		gradle: any
	}

	/**
	 * The global `jsh` object provided by the `jsh` shell.
	 *
	 * All code loaded by `jsh` also has access to the `$api` global object; see [$api](slime._api.global.html).
	 */
	interface Global {
		java: slime.jrunscript.host.Exports & {
			tools: slime.jsh.java.tools.Exports,
			log: any
		}

		tools: Tools & {
			//	deprecated
			rhino: {}
			tomcat: {}
			ncdbg: {}
		}

		script: slime.jsh.script.Exports

		js: any
		file: slime.jrunscript.file.Exports
		time: slime.time.Exports
		ip: slime.jrunscript.ip.Exports
		db: {
			jdbc: slime.jsh.db.jdbc.Exports
		}
	}
}

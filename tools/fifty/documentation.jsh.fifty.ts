//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.view.cli {
	/**
	 * The `fifty view` tool can be invoked with the following arguments:
	 *
	 * * `--base <pathname>`: The location of the project being document. Defaults to the current working directory.
	 * * `--chrome:id <value>`: The Chrome instance to use, in terms of the `local/chrome` location. Defaults to `document` if `--watch` is enabled, and
	 *   `documentation` if it is not.
	 * * `--host <value>`: If specified, will be the hostname used when serving the documentation. Otherwise, will default to
	 *   `document.<basename-of-project>` if `--watch` is enabled, and `documentation.<basename-of-project>` otherwise.
	 * * `--index <path>`: The path of the file to use as the documentation's index page. Defaults to `README.html`.
	 * * `--watch`: Whether to affirmatively watch for changes in the source code. **Currently, using `--watch` is very inefficient,
	 *   and regenerates the documentation for every request for an HTML page.**
	 */
	export type Program = slime.jsh.script.cli.Program;
}

//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.tools.code.Context } $context
	 * @param { slime.loader.Export<slime.tools.code.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			filename: {
				isText: function(basename) {
					//	Determines whether a file is text (true) or binary (false) by its name.
					//	https://fileinfo.com/ is a reasonable resource for checking whether file extensions are well-established.
					if (basename == ".DS_Store") return false;
					if (/\.txt$/.test(basename)) return true;

					if (/\.js$/.test(basename)) return true;
					if (/\.pac$/.test(basename)) return true;
					if (/\.ts$/.test(basename)) return true;
					if (/\.json$/.test(basename)) return true;

					if (/\.kts$/.test(basename)) return true;
					if (/\.gradle$/.test(basename)) return true;

					if (/\.html$/.test(basename)) return true;
					if (/\.java$/.test(basename)) return true;
					if (/\.css$/.test(basename)) return true;
					if (/\.c$/.test(basename)) return true;
					if (/\.cpp$/.test(basename)) return true;
					if (/\.xml$/.test(basename)) return true;
					if (/\.properties$/.test(basename)) return true;
					if (/\.coffee$/.test(basename)) return true;
					if (/\.md/.test(basename)) return true;
					if (/\.wav$/.test(basename)) return false;
					if (/\.xls$/.test(basename)) return false;
					if (/\.xls$/.test(basename)) return false;
					if (/\.xlsx$/.test(basename)) return false;
					if (/\.numbers$/.test(basename)) return false;
					if (/\.hgrc$/.test(basename)) return true;
					if (/\.gitignore$/.test(basename)) return true;
					if (/\.dockerignore$/.test(basename)) return true;
					if (/Dockerfile$/.test(basename)) return true;
					if (/\.bashrc$/.test(basename)) return true;
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);

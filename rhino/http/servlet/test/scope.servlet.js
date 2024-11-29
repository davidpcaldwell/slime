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
	 * @param { slime.servlet.Scope["httpd"] } httpd
	 * @param { slime.servlet.Scope["$loader"] } $loader
	 * @param { slime.servlet.Scope["$exports"] } $exports
	 * @param { any } $export
	 */
	function($api,httpd,$loader,$exports,$export) {
		$exports.handle = function(request) {
			return httpd.http.Response.text(JSON.stringify({
				$api: $api,
				httpd: httpd,
				$loader: typeof $loader,
				$exports: typeof $exports,
				$export: typeof $export
			}));
		}
	}
//@ts-ignore
)($api,httpd,$loader,$exports,$export);

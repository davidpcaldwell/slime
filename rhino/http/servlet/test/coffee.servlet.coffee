###
LICENSE
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

END LICENSE
###
coffee = httpd.loader.module "WEB-INF/coffee/module.coffee"
cup = httpd.loader.module "WEB-INF/coffee/loader.js"

$exports.handle = (request) ->
	if request.path is "coffee/a"
		return httpd.http.Response.text String(coffee.a)
	if request.path is "cup/file/b"
		return httpd.http.Response.text String(cup.file.b)

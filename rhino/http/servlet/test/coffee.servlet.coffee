coffee = httpd.loader.module "WEB-INF/coffee/module.coffee"
cup = httpd.loader.module "WEB-INF/coffee/loader.js"

$exports.handle = (request) ->
	if request.path is "coffee/a"
		return httpd.http.Response.text String(coffee.a)
	if request.path is "cup/file/b"
		return httpd.http.Response.text String(cup.file.b)


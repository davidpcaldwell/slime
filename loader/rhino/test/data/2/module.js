//	context: object which represents external namespaces somehow
//	scope: object which is intended to hold whatever this object is returning
//	load: method which can load resources associated with this module by name
//
//	configuration? listener?
//
Packages.java.lang.System.err.println("Loading script.js ...");
var script = $loader.script("js/script.js", {
	echo: $context.echo
});
$exports.multiply = script.multiply;

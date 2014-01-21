$exports.file = $loader.file("Loader.file.js");

var grandchild = $loader.module("Loader/module.js");

$exports.resource = function(path) {
	return $loader.resource(path);
};
$exports.grandchildResource = function(path) {
	return grandchild.resource(path);
}

var FilesystemProvider = function() {
}
FilesystemProvider.Implementation = function() {
}
FilesystemProvider.Implementation.canonicalize = function(string,separator) {
	var tokens = string.split(separator);
	var rv = [];
	for (var i=0; i<tokens.length; i++) {
		var name = tokens[i];
		if (name == ".") {
			//	do nothing
		} else if (name == "..") {
			rv.pop();
		} else {
			rv.push(name);
		}
	}
	return rv.join(separator);
}
$exports.FilesystemProvider = FilesystemProvider;

if ($context.os.name == "Mac OS X") {
	$exports.process = {};
	$exports.process.list = function() {
		//	Was thinking about developing an algorithm to try to detect left- and right-justification using the header
		//	row, but instead going to try an approach where we determine justification by experiment and hard-code it in the code.
		//	There are some constraints about justification and spaces; see the loop that determines the column indices in evaluate()
		//	for details.
		var columns = [{ name: "pid", align: "right" },{ name: "ppid", align: "right" },{ name: "command", align: "left", spaces: true }];
		var args = ["-A"];
		columns.forEach(function(column) {
			args.push("-o",column.name);
		});
		var result = $context.run({
			command: "ps",
			arguments: args,
			stdio: {
				output: String,
				error: String
			},
			evaluate: function(result) {
				if (result.status != 0) {
					throw new Error("ps failed.");
				} else {
					var lines = result.stdio.output.split("\n");
					var headers = lines[0];
					var startIndex = function(i) {
						return headers.indexOf(columns[i].name.toUpperCase());
					}
					var endIndex = function(i) {
						return headers.indexOf(columns[i].name.toUpperCase()) + columns[i].name.length;
					}
					var indices = [];
					indices[0] = 0;
					for (var i=1; i<columns.length; i++) {
						if (columns[i].align == "left") {
							indices[i] = startIndex(i);
						} else if (columns[i-1].align == "right") {
							indices[i] = endIndex(i-1) + 1;
						} else /* left followed by right; determine demarcation */ {
							if (!columns[i].spaces) {
								//	determine last column in range that is always a space
								throw new Error("Unimplemented.");
							} else if (!columns[i-1].spaces) {
								//	determine first column in range that is always a space
								throw new Error("Unimplemented.");
							} else {
								//	TODO	probably should try to see if there is a single space-only column, and if not, fail,
								//			but for now will just fail
								throw new Error("Cannot have two consecutive ps processes that can contain spaces");
							}
						}
					}
					var processes = lines.slice(1,lines.length-1);
					var byId = {};
					var rv = [];
					processes.forEach(function(line) {
						var object = {
							children: []
						};
						rv.push(object);
						for (var i=0; i<columns.length; i++) {
							var value = line.substring(indices[i],indices[i+1]).trim();
							if (columns[i].name == "pid") {
								object.id = Number(value);
								byId[object.id] = object;
							} else if (columns[i].name == "ppid") {
								object.parent = { id: Number(value) };
							} else {
								object[columns[i].name] = value;
							}
						}
					});
					rv.forEach(function(process) {
						var parent = byId[process.parent.id];
						if (parent) {
							process.parent = parent;
							parent.children.push(process);
						}
					});
					return rv;
					//	TODO	probably we want to check for columns in which every line has a space and use those as delimiters;
					//			consecutive numbers should be collapsed; then again perhaps should count consecutive non-space
					//			columns; think of 1-line ps with a space in the COMMAND column; this would not work properly either,
					//			more thinking required
				}
			}
		});
		return result;
	}
}
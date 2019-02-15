$set(function(p) {
	var headerMatch = /^\[(.*)\]/;
	var valueMatch = /^(\S+)(?:\s*)\=(?:\s*)(.+)$/
	var continueMatch = /^(\s+)(.*)$/
	var lines = p.file.read(String).split("\n");

	var parse = function() {
		//	From man hgrc:
		//	Each line contains one entry. If the lines that follow are indented, they are treated as continuations of that
		//	entry. Leading whitespace is removed from values. Empty lines are skipped. Lines beginning with # or ; are ignored
		//	and may be used to provide comments

		var rv = new function() {
			this.lines = [];

			var getName = function(line) {
				return (typeof(line.section) != "undefined" && line.name) ? ((line.section) ? (line.section + ".") : line.section) + line.name : null;
			}

			this.get = function(name) {
				var single = (arguments.length > 0);
				var rv = (single) ? null : {};
				this.lines.forEach(function(line) {
					if (single && getName(line) == name) {
						rv = line.value;
					} else if (!single) {
						if (getName(line)) rv[getName(line)] = line.value;
					}
				});
				return rv;
			}
		};

		var section;
		if (typeof(p.section) != "undefined") {
			section = {
				name: p.section,
				lines: []
			}
		}
		lines.forEach(function(line) {
			var current = { line: line };
			rv.lines.push(current);
			if (false) {
			} else if (line.substring(0,1) == "#" || line.substring(0,1) == ";") {
			} else if (headerMatch.test(line)) {
				var match = headerMatch.exec(line);
				current.header = match[1];
				section = { name: match[1], lines: [] };
			} else if (valueMatch.test(line)) {
				var match = valueMatch.exec(line);
				//	TODO	what if section is undefined?
				if (!section) {
					section = {
						name: "",
						lines: []
					};
				}
				section.lines.push(current);
				current.section = section.name;
				current.name = match[1];
				current.value = match[2];
			} else if (continueMatch.test(line)) {
				throw new Error("Unimplemented: line continuation.");
			} else if (!line) {
			} else {
				//	jsh.shell.echo("No match: " + line);
			}
		});
		return rv;
	};

	this.get = function(name) {
		if (arguments.length > 0) {
			return parse().get(name)
		} else {
			return parse().get();
		}
	};

	this.set = function(section,name,value) {
		//	TODO	more intelligent implementation
		lines.push("[" + section + "]");
		lines.push(name + " = " + value);
	};

	var normalizeSections = function(parsed) {
		var section;
		var bySection = {};
		var after = [];
		parsed.lines.forEach(function(entry) {
			if (false) {
			} else if (entry.header) {
				if (section) {
					section.index = after.length;
				}
				section = {};
				if (false) {
				} else if (!bySection[entry.header]) {
					bySection[entry.header] = section;
					after.push(entry);
				} else {
					section = bySection[entry.header];
					section.append = true;
					//	repeated; do not add
				}
			} else {
				if (section && section.append) {
					after.splice(section.index,0,entry);
					section.index++;
				} else {
					after.push(entry);
				}
			}
		});
		return after.map(function(entry) {
			return entry.line;
		});
	};

	var normalizeLines = function(parsed) {
		var indexByName = {};
		var rv = [];
		parsed.lines.forEach(function(entry) {
			if (false) {
			} else if (entry.section && entry.name) {
				var key = entry.section + "." + entry.name;
				if (typeof(indexByName[key]) != "undefined") {
					rv[indexByName[key]] = entry;
				} else {
					indexByName[key] = rv.length;
					rv.push(entry);
				}
			} else {
				rv.push(entry);
			}
		});
		return rv.map(function(entry) {
			return entry.line;
		});
	}

	this.normalize = function() {
		//	Check for duplicate sections and eliminate
		lines = normalizeSections(parse());
		lines = normalizeLines(parse());
	};

	this.write = function() {
		p.file.pathname.write(lines.join("\n"), { append: false });
	};

	this.unit = {
		parse: parse
	};

	// TODO: Object.defineProperty
	this.unit.__defineGetter__("lines", function() {
		return lines;
	});
});

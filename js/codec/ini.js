//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.loader.Export<slime.codec.ini.Exports> } $export
	 */
	function($export) {
		/**
		 *
		 * @param { string } line
		 */
		function isComment(line) {
			return line.substring(0,1) == "#" || line.substring(0,1) == ";";
		}

		var isHeader = (
			function() {
				var headerMatch = /^\[(.*)\]/;
				/** @type { (line: string) => RegExpExecArray } */
				return function(line) {
					return headerMatch.exec(line);
				}
			}
		)();

		var isValue = (
			function() {
				var valueMatch = /^(\S+)(?:\s*)\=(?:\s*)(.+)$/;
				/** @type { (line: string) => RegExpExecArray } */
				return function(line) {
					return valueMatch.exec(line);
				}
			}
		)();

		//	Mercurial format uses indentation to indicate line continuation
		//	var continueMatch = /^(\s+)(.*)$/

		/**
		 *
		 * @param { { section: { name: string, lines: slime.codec.ini.internal.ValueLine[] }} } state
		 * @param { string } line
		 * @returns { slime.codec.ini.internal.Line }
		 */
		function parseLine(state,line) {
			//	blank line, skip
			if (!line) return { line: line };

			//	comment; skip
			if (isComment(line)) return { line: line };

			if (isHeader(line)) {
				var match = isHeader(line);
				/** @type { slime.codec.ini.internal.HeaderLine } */
				var header = { line: line, header: match[1] };
				state.section = { name: match[1], lines: [] };
				return header;
			}

			if (isValue(line)) {
				var match = isValue(line);
				/** @type { slime.codec.ini.internal.ValueLine } */
				var value = {
					line: line,
					section: state.section.name,
					name: match[1],
					value: match[2]
				}
				state.section.lines.push(value);
				return value;
			}

			throw new TypeError("Parse error.");
		}

		/**
		 *
		 * @param { string[] } lines
		 * @returns
		 */
		function parse(lines) {
			//	From man hgrc:
			//	Each line contains one entry. If the lines that follow are indented, they are treated as continuations of that
			//	entry. Leading whitespace is removed from values. Empty lines are skipped. Lines beginning with # or ; are ignored
			//	and may be used to provide comments

			var getName = function(line) {
				return (typeof(line.section) != "undefined" && line.name) ? ((line.section) ? (line.section + ".") : line.section) + line.name : null;
			}

			/** @type { (line: any) => line is slime.codec.ini.internal.ValueLine } */
			var isValueLine = function(line) {
				return typeof(line.section) != "undefined" && line.name;
			}

			/**
			 * @type { slime.codec.ini.internal.Parsed }
			 */
			var rv = {
				lines: [],
				value: function(name) {
					var rv = null;
					this.lines.forEach(function(line) {
						if (isValueLine(line) && getName(line) == name) rv = line.value;
					});
					return rv;
				},
				values: function() {
					/** @type { { [x: string]: string } } */
					var rv = {};
					this.lines.forEach(function(line) {
						if (isValueLine(line) && getName(line)) rv[getName(line)] = line.value;
					});
					return rv;
				},
			}

			var state = {
				section: {
					name: "",
					lines: []
				}
			};

			lines.forEach(function(line) {
				rv.lines.push(
					parseLine(
						state,
						line
					)
				);
			});

			return rv;
		};

		$export({
			codec: function() {
				return {
					value: function(file, name) {
						return parse(file.split("\n")).value(name);
					}
				}
			}
		});

		// $set(
		// 	function (p) {
		// 		this.set = function(section,name,value) {
		// 			if (!section) {
		// 				var now = parse(lines).lines;
		// 				lines = now.map(function(line) {
		// 					if (!line.section && line.name == name) {
		// 						return line.name + " = " + value;
		// 					} else {
		// 						return line.line;
		// 					}
		// 				});
		// 			} else {
		// 				//	TODO	more intelligent implementation
		// 				lines.push("[" + section + "]");
		// 				lines.push(name + " = " + value);
		// 			}
		// 		};

		// 		this.remove = function(section,name) {
		// 			var now = parse(lines).lines;
		// 			lines = now.filter(function(line) {
		// 				if (line.section == section && line.name == name) return false;
		// 				return true;
		// 			}).map(function(line) {
		// 				return line.line;
		// 			})
		// 		}

		// 		var normalizeSections = function(parsed) {
		// 			var section;
		// 			var bySection = {};
		// 			var after = [];
		// 			parsed.lines.forEach(function(entry) {
		// 				if (false) {
		// 					//	just for chaining else-if
		// 				} else if (entry.header) {
		// 					if (section) {
		// 						section.index = after.length;
		// 					}
		// 					section = {};
		// 					if (false) {
		// 						//	just for chaining else-if
		// 					} else if (!bySection[entry.header]) {
		// 						bySection[entry.header] = section;
		// 						after.push(entry);
		// 					} else {
		// 						section = bySection[entry.header];
		// 						section.append = true;
		// 						//	repeated; do not add
		// 					}
		// 				} else {
		// 					if (section && section.append) {
		// 						after.splice(section.index,0,entry);
		// 						section.index++;
		// 					} else {
		// 						after.push(entry);
		// 					}
		// 				}
		// 			});
		// 			return after.map(function(entry) {
		// 				return entry.line;
		// 			});
		// 		};

		// 		var normalizeLines = function(parsed) {
		// 			var indexByName = {};
		// 			var rv = [];
		// 			parsed.lines.forEach(function(entry) {
		// 				if (false) {
		// 					//	just for chaining else-if
		// 				} else if (entry.section && entry.name) {
		// 					var key = entry.section + "." + entry.name;
		// 					if (typeof(indexByName[key]) != "undefined") {
		// 						rv[indexByName[key]] = entry;
		// 					} else {
		// 						indexByName[key] = rv.length;
		// 						rv.push(entry);
		// 					}
		// 				} else {
		// 					rv.push(entry);
		// 				}
		// 			});
		// 			return rv.map(function(entry) {
		// 				return entry.line;
		// 			});
		// 		}

		// 		this.normalize = function() {
		// 			//	Check for duplicate sections and eliminate
		// 			lines = normalizeSections(parse());
		// 			lines = normalizeLines(parse());
		// 		};
		// 	}
		// );
	}
//@ts-ignore
)($export);

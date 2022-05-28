//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	function() {
		/** @type { slime.jrunscript.tools.profiler.viewer.Profile[] } */
		var profiles = window["profiles"];

		//	TODO	requires relatively advanced JavaScript implementation for Array.prototype.forEach
		var div = function(className,parent) {
			var rv = document.createElement("div");
			rv.className = className;
			parent.appendChild(rv);
			return rv;
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.viewer.Profile[] } profiles
		 */
		var calculate = function(profiles) {
			profiles.forEach(function(profile) {
				var calculateNode = function(node) {
					if (node.children.length) {
						node.children.forEach(function(child) {
							calculateNode(child);
						});
						var self = node.statistics.elapsed;
						node.children.forEach(function(child) {
							self -= child.statistics.elapsed;
						});
						//	TODO	in theory should not have to check for this, but we are working around bug in which main(String[]) and (top) have 0 elapsed
						node.self = {
							code: { self: node.code },
							statistics: {
								elapsed: self,
								count: node.statistics.count
							},
							children: []
						};
						node.children.push(node.self);
					}
				};

				calculateNode(profile.timing.root);
			});
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.viewer.Profile[] } profiles
		 * @param { slime.jrunscript.tools.profiler.viewer.Settings } [settings]
		 */
		var render = function(profiles,settings) {
			if (!settings) {
				settings = {
					threshold: 0
				}
			}
			document.getElementById("data").innerHTML = "";

			var top = document.createElement("div");
			document.getElementById("data").appendChild(top);

			profiles.forEach(function(profile) {
				var div_profile = document.createElement("div");
				div_profile.className = "profile";
				top.appendChild(div_profile);

				var div_thread = document.createElement("h1");
				div_thread.className = "thread";
				div_profile.appendChild(div_thread);
				div_thread.innerHTML = profile.thread.name;

				var div_tree = div("tree", div_profile);
				var heading = document.createElement("h2");
				heading.innerHTML = "Tree";
				div_tree.appendChild(heading);
				div_profile.appendChild(div_tree);

				/** @type { (code: slime.jrunscript.tools.profiler.viewer.Code) => code is slime.jrunscript.tools.profiler.viewer.JavaCode } */
				var isJavaCode = function(code) {
					return code["className"] && code["methodName"];
				}

				/** @type { (code: slime.jrunscript.tools.profiler.viewer.Code) => code is slime.jrunscript.tools.profiler.viewer.JavascriptCode } */
				var isJavascriptCode = function(code) {
					return code["sourceName"];
				}

				/** @type { (code: slime.jrunscript.tools.profiler.viewer.Code) => code is slime.jrunscript.tools.profiler.viewer.SelfCode } */
				var isSelfCode = function(code) {
					return code["self"];
				}

				/**
				 *
				 * @param { slime.jrunscript.tools.profiler.viewer.Code } code
				 * @returns
				 */
				var nodeName = function(code) {
					if (isJavaCode(code)) {
						return code.className + " " + code.methodName + " " + code.signature;
					} else if (isJavascriptCode(code)) {
						var location = (code.lineNumber) ? code.sourceName + ":" + code.lineNumber : code.sourceName;
						var lineRange = (code.lineNumbers) ? "[" + code.lineNumbers[0] + "-" + code.lineNumbers[code.lineNumbers.length-1] + "]" : "";
						var nameToken = (code.functionName) ? ": " + code.functionName + "()" : "";
						return location + lineRange + nameToken;
					} else if (isSelfCode(code)) {
						return "(self)";
					} else {
						return "(top)";
					}
				}

				/**
				 *
				 * @param { slime.jrunscript.tools.profiler.viewer.Node } node
				 * @returns
				 */
				var renderNode = function(node) {
					var top = document.createElement("div");
					top.className = "node";
					var total = div("total", top);
					var name = nodeName(node.code);
					total.innerHTML = (node.statistics.elapsed/1000).toFixed(3) + " " + node.statistics.count + " " + name.replace(/\</g, "&lt;");
					node.children.filter(function(child) {
						//	Work around problem with top level
						var children = 0;
						child.children.forEach(function(gc) {
							if (gc != child.self) {
								children += gc.statistics.elapsed;
							}
						});
						if (children >= settings.threshold) return true;

						return child.statistics.elapsed >= settings.threshold;
					}).sort(function(a,b) {
						return b.statistics.elapsed - a.statistics.elapsed;
					}).forEach(function(child) {
						top.appendChild(renderNode(child));
					});
					return top;
				}

				div_tree.appendChild(renderNode(profile.timing.root));

				var div_hotspots = div("hotspots", div_profile);
				var heading = document.createElement("h2");
				heading.innerHTML = "Hot Spots";
				div_hotspots.appendChild(heading);

				var map = {};

				/**
				 *
				 * @param { slime.jrunscript.tools.profiler.viewer.Node } node
				 */
				var addToHotspots = function(node) {
					var key = (function() {
						if (!isSelfCode(node.code)) return nodeName(node.code);
						if (isSelfCode(node.code)) return nodeName(node.code.self);
						// return nodeName({ code: node.self.code.self })
					})();
					if (!map[key]) {
						map[key] = {
							count: 0,
							elapsed: 0
						};
					}
					if (node.self) {
						//	Do nothing; self is also included in children
					} else {
						map[key].count += node.statistics.count;
						map[key].elapsed += node.statistics.elapsed;
					}
					node.children.forEach(function(child) {
						addToHotspots(child);
					});
				};

				addToHotspots(profile.timing.root);

				var list = [];
				for (var x in map) {
					list.push({ key: x, count: map[x].count, elapsed: map[x].elapsed });
				}
				list.sort(function(a,b) {
					return b.elapsed - a.elapsed;
				});
				if (false) {
					var total = { count: 1, elapsed: 0 };
					list.forEach(function(item) {
						//	TODO	this check is to work around the negative-self-time bug
						if (item.elapsed > 0) {
							total.elapsed += item.elapsed;
						}
					});
					list.push({ key: "TOTAL", count: total.count, elapsed: total.elapsed });
				}
				list.forEach(function(item) {
					if ( item.elapsed >= settings.threshold ) {
						var hotspotdiv = div("hotspot", div_hotspots);
						hotspotdiv.innerHTML = (item.elapsed / 1000).toFixed(3) + " " + item.count + " " + item.key.replace(/\</g, "&lt;");
					}
				})
			});
		}

		window.addEventListener("load", function() {
			calculate(profiles);
			render(profiles);
			document.getElementById("refresh").addEventListener("click", function() {
				/** @type { slime.js.Cast<HTMLInputElement> } */
				var asInputElement = function(v) { return v; };

				/** @type { HTMLInputElement } */
				var threshold = asInputElement(document.getElementById("threshold"));
				var settings = {
					threshold: Number(threshold.value) * 1000
				};
				render(profiles,settings);
			});
		});
	}
)();

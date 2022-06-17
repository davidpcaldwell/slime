//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { Window & { profiles: slime.jrunscript.tools.profiler.rhino.Profile[] } } window
	 */
	function(window) {
		/**
		 * Creates a div, sets its HTML class, appends it to its parent, and returns it for further processing, in one step.
		 *
		 * @param { HTMLElement } parent
		 * @param { string } [className]
		 * @return { HTMLElement }
		 */
		function under(parent,type,className) {
			var rv = document.createElement(type);
			if (className) rv.className = className;
			parent.appendChild(rv);
			return rv;
		}

		/**
		 * Creates a div, sets its HTML class, appends it to its parent, and returns it for further processing, in one step.
		 *
		 * @param { HTMLElement } parent
		 * @param { string } [className]
		 * @return { HTMLDivElement }
		 */
		function divUnder(parent,className) {
			/** @type { slime.js.Cast<HTMLDivElement> } */
			var cast = function(p) { return p; };
			return cast(under(parent,"div",className));
		}

		/** @type { (code: slime.jrunscript.tools.profiler.rhino.Code) => code is slime.jrunscript.tools.profiler.rhino.JavaCode } */
		var isJavaCode = function(code) {
			return code["className"] && code["methodName"];
		}

		/** @type { (code: slime.jrunscript.tools.profiler.rhino.Code) => code is slime.jrunscript.tools.profiler.rhino.JavascriptCode } */
		var isJavascriptCode = function(code) {
			return code["sourceName"];
		}

		/** @type { (code: slime.jrunscript.tools.profiler.rhino.Code) => code is slime.jrunscript.tools.profiler.rhino.SelfCode } */
		var isSelfCode = function(code) {
			return code["self"];
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.rhino.Code } code
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
		 * @param { slime.jrunscript.tools.profiler.rhino.Node } node
		 */
		var addSelfNodeTo = function(node) {
			if (node.children.length) {
				node.children.forEach(function(child) {
					addSelfNodeTo(child);
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

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.rhino.Profile[] } profiles
		 */
		var addSelfNodes = function(profiles) {
			profiles.forEach(function(profile) {
				addSelfNodeTo(profile.timing.root);
			});
		};

		/**
		 * @param { slime.jrunscript.tools.profiler.rhino.Hotspots } map
		 * @param { slime.jrunscript.tools.profiler.rhino.Node } node
		 */
		var addToHotspots = function(map,node) {
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
				addToHotspots(map,child);
			});
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.rhino.Profile } profile
		 */
		var getHotspots = function(profile) {
			/** @type { slime.jrunscript.tools.profiler.rhino.Hotspots } */
			var map = {};
			addToHotspots(map,profile.timing.root);
			return map;
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.rhino.Statistics } statistics
		 * @param { string } name
		 * @returns
		 */
		var createNodeText = function(statistics,name) {
			return document.createTextNode(
				(statistics.elapsed/1000).toFixed(3) + " " + statistics.count + " " + name
			)
		};

		/**
		 *
		 * @param { slime.jrunscript.tools.profiler.rhino.Profile[] } profiles
		 * @param { slime.jrunscript.tools.profiler.viewer.Settings } [settings]
		 */
		var render = function(profiles,settings) {
			if (!settings) {
				settings = {
					threshold: 0
				}
			}
			document.getElementById("data").innerHTML = "";

			var top = divUnder(document.getElementById("data"));

			profiles.forEach(function(profile) {
				if (profile.timing.root.statistics.elapsed < settings.threshold) return;

				var div_profile = divUnder(top, "profile");

				var div_thread = under(div_profile, "h2", "thread");
				div_thread.innerHTML = profile.thread.name;

				var div_tree = divUnder(div_profile, "tree");
				under(div_tree, "h3").innerHTML = "Tree";

				/**
				 *
				 * @param { slime.jrunscript.tools.profiler.rhino.Node } node
				 * @returns
				 */
				var renderNode = function(node) {
					var top = document.createElement("div");
					top.className = "node";
					var total = divUnder(top, "total");
					total.appendChild(createNodeText(node.statistics, nodeName(node.code)));
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

				var div_hotspots = divUnder(div_profile, "hotspots");
				under(div_hotspots, "h3").innerHTML = "Hot Spots";

				Object.entries(getHotspots(profile)).map(function(entry) {
					return { key: entry[0], count: entry[1].count, elapsed: entry[1].elapsed };
				}).sort(function(a,b) {
					return b.elapsed - a.elapsed;
				}).forEach(function(item) {
					if ( item.elapsed >= settings.threshold ) {
						var hotspotdiv = divUnder(div_hotspots, "hotspot");
						hotspotdiv.appendChild(createNodeText(item, item.key));
					}
				});
			});
		}



		window.addEventListener("load", function() {
			/** @type { Promise<slime.jrunscript.tools.profiler.rhino.Profile[]> } */
			var getProfiles = (window.profiles) ? Promise.resolve(window.profiles) : (function() {
				var query = window.location.search.substring(1).split("&").reduce(function(rv,pair) {
					var tokens = pair.split("=");
					rv[tokens[0]] = tokens[1];
					return rv;
				}, {
					profiles: void(0)
				});
				return window.fetch(query.profiles).then(function(response) {
					return response.json();
				});
			})();

			getProfiles.then(function(profiles) {
				addSelfNodes(profiles);
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
		});
	}
//@ts-ignore
)(window);

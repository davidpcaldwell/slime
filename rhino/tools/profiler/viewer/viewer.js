//	TODO	requires relatively advanced JavaScript implementation for Array.prototype.forEach
var div = function(className,parent) {
	var rv = document.createElement("div");
	rv.className = className;
	parent.appendChild(rv);
	return rv;
}

var render = function(profiles,settings) {
	if (!settings) {
		settings = {
			threshold: 0
		}
	};
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
		
		var renderNode = function(node) {
			var top = document.createElement("div");
			top.className = "node";
			var total = div("total", top);
			var name = (function() {
				if (node.code.className && node.code.methodName) {
					return node.code.className + " " + node.code.methodName + " " + node.code.signature;
				} else if (node.code.sourceName && node.code.lineNumbers) {
					return node.code.sourceName + " [" + node.code.lineNumbers[0] + "-" + node.code.lineNumbers[node.code.lineNumbers.length-1] + "]";
				} else {
					return "(top)";
				}
			})();
			total.innerHTML = (node.statistics.elapsed/1000).toFixed(3) + " " + node.statistics.count + " " + name.replace(/\</g, "&lt;");
			node.children.filter(function(child) {
				var children = 0;
				child.children.forEach(function(gc) {
					children += gc.statistics.elapsed;
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
	});
}

window.addEventListener("load", function() {
	render(profiles);
	document.getElementById("refresh").addEventListener("click", function() {
		var settings = {
			threshold: Number(document.getElementById("threshold").value) * 1000
		};
		render(profiles,settings);
	});
});


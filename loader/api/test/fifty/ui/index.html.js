var FiftyInterface = function() {
	var rv = Reflect.construct(HTMLDivElement, [], FiftyInterface);
	var instance = document.getElementById('fifty-interface').content.cloneNode(true);
	var shadow = rv.attachShadow({ mode: "open" })
	shadow.appendChild(instance);
	rv.connectedCallback = function() {
		debugger;
	}
	return rv;
}
FiftyInterface.prototype = Object.create(HTMLDivElement.prototype);

customElements.define("fifty-interface", FiftyInterface, { extends: "div" });

var fillSlot = function(element,slot,content) {
	content.setAttribute("slot", slot);
	element.appendChild(content);
}

var createFiftyInterface = function(p) {
	var rv = document.createElement("div", { is: "fifty-interface" });
	var name = document.createElement("span");
	name.appendChild(document.createTextNode(p.name));
	fillSlot(rv, "name", name);
	return rv;
}

window.addEventListener("load", function() {
	if (window.location.search == "?design") {
		var element = createFiftyInterface({ name: "a.a.name" });
		document.getElementById("interfaces").appendChild(element);
	} else {
		var tsc = inonit.loader.loader.get("tsc.json").read(JSON);
		for (var x in tsc.interfaces) {
			element = createFiftyInterface({ name: x });
			document.getElementById("interfaces").appendChild(element);
		}
	}
});

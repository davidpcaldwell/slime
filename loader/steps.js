$exports.run = function(p) {
	var events = (p.on) ? $context.Events(p.on) : $context.Events({ source: {} });
	var list = p.list.slice();
	var more = true;
	while(list.length && more) {
		more = false;
		for (var i=0; i<list.length; i++) {
			if (list[i].ready()) {
				list[i].run();
				list.splice(i,1);
				more = true;
				break;
			}
		}
	}
	list.forEach(function(item) {
		events.fire("unready", item);
	});
}
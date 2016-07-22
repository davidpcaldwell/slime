$set(new function() {
	this.before = function(line) {
		var matcher = /^(\s*)\S?/;
		return matcher.exec(line)[1];
	};

	this.after = function(line) {
		var matcher = /\S?(\s*)$/;
		return matcher.exec(line)[1];
	};

	this.is = function(line) {
		return /^(\s*)$/.test(line);
	};

	this.common = function(lines) {
		lines = lines.filter(function(line) {
			return !this.is(line);
		},this);
		var rv = this.before(lines[0]);
		for (var i=1; i<lines.length; i++) {
			while(lines[i].substring(0,rv.length) != rv) {
				rv = rv.substring(0,rv.length-1);
			}
		}
		return rv;		
	}

	//	TODO	no real test coverage
	this.content = function(data) {
		var lines = data.split("\n");
		var before = [];
		while(this.is(lines[0])) {
			before.push(lines[0]);
			lines.splice(0,1);
		}
		var after = [];
		while(this.is(lines[lines.length-1])) {
			after.unshift(lines[lines.length-1]);
			lines.splice(lines.length-1,1);
		}
		var prefix = this.common(lines);
		return {
			before: before,
			after: after,
			indent: prefix,
			lines: lines.map(function(line) {
				return line.substring(prefix.length);
			})
		}
	}
});

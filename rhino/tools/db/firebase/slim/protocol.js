var state;

$exports.state = function() {
	state = arguments[0];
}

$exports.Location = new function() {
	this.encode = function(p) {
		return p;
	};
	
	this.decode = function(p) {
		var rv = inonit.js.Object.set({}, p);
		rv.read.GET = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.read.GET);
		rv.write.POST = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.write.POST);
		return rv;
	}
};

$exports.Reference = new function() {
	this.encode = function(p) {
		return p;
	}
	
	this.decode = function(p) {
		var rv = inonit.js.Object.set({}, p);
		rv.PUT = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.PUT);
		return rv;
	}	
}
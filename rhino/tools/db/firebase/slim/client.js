var firebase = inonit.slim.loader.file("db/firebase/vendor/firebase.js");
var firebaseLogin = inonit.slim.loader.file("db/firebase/vendor/firebase-simple-login.js");

var protocol = $loader.file("protocol.js");
$context.protocol(protocol);

var service = $context.service.GET();

$exports.Database = function(p) {
	var url = p.url;
	var state = {};
	protocol.state(state);
	
//	this.authorize = function(endpoint) {
//		if (sessionState && sessionState.returned) {
//			return endpoint.headers({ Authorization: "Firebase " + sessionState.returned.firebaseAuthToken });
//		} else {
//			return endpoint;
//		}
//	}
	
	this.root = function() {
		var invoke = service.location.GET.parameters({ url: p.url });
		return invoke;
	};
	
//	this.Reference = function(path) {
//		var relative = (path) ? path : "";
//		
////		this.read = function() {
////			var ask = service.GET().reference.GET.parameters({ url: url + relative });
////			var rv = function(tell) {
////				var reference = ask();
////				
////			};
////			return rv;
////		}
//	}
	
	if (p.session) {
		this.session = new function() {
			var auth = new firebaseLogin.FirebaseSimpleLogin(new firebase.Firebase(url), function(error, user) {
				var notify = function(result) {
					if (result.threw) {
						if (state.session) delete state.session;
					} else if (result.returned) {
						state.session = result.returned;
					} else {
						state.session = result.returned;
					}
					if (p.session.tell) p.session.tell(result);
				}

				if (error) {
					//	TODO	what would really be in this error object?
					notify({ threw: error });
				} else if (user) {
					notify({ returned: user });
				} else {
					notify({ returned: null });
				}
			});

			this.login = function() {
				return auth.login.apply(auth,arguments);
			};

			this.logout = function() {
				return auth.logout.apply(auth,arguments);
			};
		};
	}
}

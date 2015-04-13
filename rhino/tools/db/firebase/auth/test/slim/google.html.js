//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (inonit.slim.$reload) {
	inonit.slim.$reload();
}

inonit.slim.initialize(function() {
	var firebase = inonit.slim.loader.file("db/firebase/vendor/firebase.js");
	var firebaseLogin = inonit.slim.loader.file("db/firebase/vendor/firebase-simple-login.js");
	for (var x in firebaseLogin) {
		firebase[x] = firebaseLogin[x];
	}

	inonit.slim.configuration.initialize = function() {
		firebase.Session = function(p) {
			var db = new firebase.Firebase(p.url);
			var state;

			var auth = new firebase.FirebaseSimpleLogin(db, function(error, user) {
				var notify = function(result) {
					state = result;
					p.tell(result);
				}

				//	This callback is actually invoked twice under some still indeterminate set of circumstances; once before popup
				//	with current login, and one after the popup is disposed. Not sure whether this is acceptable
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

		var loginState;

		var sessionListener = (function(result) {
			loginState = result;
			this.update();
		}).bind(this);

		firebase.session = new firebase.Session({
			url: "https://scorching-fire-4668.firebaseio.com/",
			tell: sessionListener
		});

		this.getComponent("session").update.add(function() {
			if (!loginState) {
				this.getComponent("state").element.style.display = "none";
				this.getComponent("login").element.style.display = "none";
				this.getComponent("logout").element.style.display = "none";
			} else if (loginState && loginState.returned) {
				this.getComponent("state").element.style.display = "";
				this.getComponent("login").element.style.display = "none";
				this.getComponent("logout").element.style.display = "";
				this.getComponent("state").set({
					user: loginState.returned.email
				});
			} else if (loginState && loginState.returned == null) {
				this.getComponent("state").element.style.display = "none";
				this.getComponent("login").element.style.display = "";
				this.getComponent("logout").element.style.display = "none";
			}
		});

		this.action({
			child: "session/login",
			on: "click",
			call: function(e) {
				firebase.session.login("google");
			}
		});

		this.action({
			child: "session/logout",
			on: "click",
			call: function(e) {
				firebase.session.logout();
			}
		});
	}
});
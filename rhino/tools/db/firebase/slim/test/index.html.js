if (inonit.slim.$reload) inonit.slim.$reload();

inonit.slim.initialize(function() {
	this.getComponent("session").initialize = function() {
		var protocol = {};
		var service = this.rest.Service({
			protocol: protocol
		});
		
		var firebase = inonit.slim.loader.module("db/firebase/slim/client.js", {
			service: service.GET().firebase,
			protocol: function(value) {
				protocol.firebase = value;
			}
		});

		var database = new firebase.Database({
			url: "https://sizzling-fire-9494.firebaseio.com/",
			session: {
				tell: (function(result) {
					this.set(result);
				}).bind(this)
			}
		});
		
		this.database = database;
		
		this.update.add(function() {
			if (!this.model) {
				this.getComponent("state").element.style.display = "none";
				this.getComponent("login").element.style.display = "none";
				this.getComponent("logout").element.style.display = "none";
			} else if (this.model && this.model.returned) {
				this.getComponent("state").element.style.display = "";
				this.getComponent("login").element.style.display = "none";
				this.getComponent("logout").element.style.display = "";
				this.getComponent("state").set({
					user: this.model.returned.email
				});				
			} else if (this.model && this.model.returned == null) {
				this.getComponent("state").element.style.display = "none";
				this.getComponent("login").element.style.display = "";
				this.getComponent("logout").element.style.display = "none";
			}
		});

		this.action({
			child: "login",
			on: "click",
			call: function(e) {
				database.session.login("google");
			}
		});		

		this.action({
			child: "logout",
			on: "click",
			call: function(e) {
				database.session.logout();
			}
		});		
	};
});

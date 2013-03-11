var _Address = function(value) {
	var rv = new Packages.javax.mail.internet.InternetAddress();
	if (typeof(value) == "string") {
		rv.setAddress(value);
	} else if (typeof(value) == "object") {
		if (value.name) {
			rv.setPersonal(value.name);
		}
		rv.setAddress(value.email);
	}
	return rv;
};
_Address.toJava = function(addresses) {
	return $context.api.java.toJavaArray(addresses.map(_Address), Packages.javax.mail.Address );
}

var Message_toPeer = function(_session) {
	var _rv = new Packages.javax.mail.internet.MimeMessage(_session);

	_rv.setFrom(_Address(this.from));
	_rv.setSubject(this.subject);
	//	TODO	Reply-To: address?
	["to","cc","bcc"].forEach(function(kind) {
		var array = (this[kind]) ? this[kind] : [];
		_rv.setRecipients(Packages.javax.mail.Message.RecipientType[kind.toUpperCase()], _Address.toJava(array));
	}, this);

	var bodyparts = [];
	if (this.text) {
		bodyparts.push({
			type: new $context.api.mime.Type("text", "plain"),
			string: this.text
		});
	}
	if (this.html) {
		bodyparts.push({
			type: new $context.api.mime.Type("text", "html"),
			string: this.html.toString()
		});
	}
	if (bodyparts.length == 0) {
		bodyparts.push({
			type: new $context.api.mime.Type("text", "plain"),
			string: ""
		});
	}
	var attachments = (this.attachments) ? this.attachments : [];

	var DataSource = function(p) {
		return new JavaAdapter(
			Packages.javax.activation.DataSource,
			new function() {
				this.getInputStream = function() {
					return p.resource.read.binary().java.adapt();
				};

				this.getOutputStream = function() {
					//	TODO	In JavaMail, this is appropriate, although perhaps this should be made a Java peer of Resource that should be easily
					//			available from that object
					throw new Error();
				};

				this.getContentType = function() {
					jsh.shell.echo("Content type: " + p.resource.type.toString());
					return p.resource.type.toString();
				};

				this.getName = function() {
					return (p.name) ? p.name : null;
				};
			}
		);
	};

	var Part = function(resource) {
		this.resource = resource;
		this.type = resource.type;
		this.stream = resource.read.binary();
	};
	
	var DataHandler = Packages.javax.activation.DataHandler;
	jsh.shell.echo("Packages.javax.mail.Session = " + Packages.javax.mail.Session);
	var MimeMultipart = Packages.javax.mail.internet.MimeMultipart;

	var body = (function() {
		if (bodyparts.length == 1) {
			//	TODO	probably, for consistency, should use the DataSource mechanism used below
			return bodyparts[0];
		} else {
			var alternative = new $context.api.mime.Multipart({
				subtype: "alternative", 
				parts: bodyparts
			});
			return new Part(alternative);
		}
	})();

	if (!attachments.length) {
		if (body.resource) {
			jsh.shell.echo("body.resource with no attachments");
//			_rv.setDataHandler(new DataHandler(DataSource({ resource: body.resource })));
			_rv.setContent(new MimeMultipart(DataSource({ resource: body.resource })));
		} else {
			jsh.shell.echo("no body.resource with no attachments");
			//	TODO	probably, for consistency, should use the DataSource mechanism
			_rv.setContent(body.string,body.type.toString());
		}
	} else {
		//	TODO	the below is confusing. We know that if attachments.length is 0, this is a multipart
		jsh.shell.echo("attachments: body=" + body + " attachments=" + attachments);
		var content = new $context.api.mime.Multipart({
			subtype: "mixed",
			parts: [body].concat(attachments)
		});
		_rv.setDataHandler(new DataHandler(DataSource({ resource: content })));
	}
	return _rv;
};

var Message = function() {
};

var Session = function(p) {
	var _session = Packages.javax.mail.Session.getInstance(p._properties);
	
	var _transport;
	
	this.send = function(message) {
		var _message = Message_toPeer.call(message,_session);
		if (true) {
			//	gmail
			if (!_transport) {
				_transport = _session.getTransport();
				_transport.connect(p.credentials.user, p.credentials.password);			
			}
			var before = Packages.java.lang.Thread.currentThread().getContextClassLoader();
			Packages.java.lang.Thread.currentThread().setContextClassLoader(_session.getClass().getClassLoader());
			_transport.sendMessage(_message,_message.getAllRecipients());
			Packages.java.lang.Thread.currentThread().setContextClassLoader(before);
		} else {
			//	GAE (untested)
			//	Packages.javax.mail.Transport.send(_message);
		}
	}
};
Session._properties = {};
Session._properties.GMAIL = (function() {
	var properties = new Packages.java.util.Properties();
	//mail.store.protocol, mail.transport.protocol, mail.host, mail.user, and mail.from
	properties.put("mail.store.protocol", "imaps");

	properties.put("mail.imaps.host", "imap.gmail.com");

	properties.put("mail.transport.protocol", "smtps");
	properties.put("mail.smtps.host", "smtp.gmail.com");
	properties.put("mail.smtps.port", "465");
	properties.put("mail.smtps.auth", "true");
	return properties;
})();

$exports.Session = Session;

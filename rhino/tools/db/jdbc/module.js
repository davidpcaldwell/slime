if (!$context.api || !$context.api.js) {
	throw new Error("Required: $context.api.js");
						
//						//	Statement creation optimized to stream results for MySQL Connector/J driver; currently there is no
//						//	easy way for an individual driver to customize this object
//						//	TODO	but there should be an easier way and so this should be refactored
//						if (false) {
//							statement = peer.createStatement();
//						} else {
//							statement = peer.createStatement(Packages.java.sql.ResultSet.TYPE_FORWARD_ONLY, Packages.java.sql.ResultSet.CONCUR_READ_ONLY);
//							statement.setFetchSize(Packages.java.lang.Integer.MIN_VALUE);							
//						}
						
}

var core = $loader.file("core.js");

var drivers = $loader.file("drivers.js", {
	api: $context.api.js.Object.set({}, $context.api, { core: core })
});

var api = $loader.file("api.js", {
	api: $context.api
});

var getJavaClass = $context.api.java.getClass;

var disableBreakOnExceptionsFor = ($context.api && $context.api.debug && $context.api.debug.disableBreakOnExceptionsFor) 
	? $context.api.debug.disableBreakOnExceptionsFor
	: function(f) { return f; }
;

disableBreakOnExceptionsFor(function() {
	if (getJavaClass("org.apache.derby.jdbc.EmbeddedDriver")) {
		$exports.derby = $loader.module("derby/module.js",drivers);
	}

	if (getJavaClass("org.postgresql.ds.PGSimpleDataSource")) {
		$exports.postgresql = $loader.module("postgresql/module.js",drivers);
	}
	
	if (getJavaClass("com.mysql.jdbc.Driver")) {
		$exports.mysql = $loader.module("mysql/module.js",drivers);
	}
})();


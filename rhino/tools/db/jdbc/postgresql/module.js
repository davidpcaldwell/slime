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

var Identifier = function(p) {
	if (typeof(p) == "string") {
		this.toString = function() {
			return p.toLowerCase();
		};
		this.sql = function() {
			return p;
		};
	} else if (typeof(p) == "object" && p.string) {
		this.toString = function() {
			return p.string;
		};
		this.sql = function() {
			return "\"" + p.string + "\"";
		};
	} else {
		throw new Error("Unimplemented: Identifier with typeof(p) == " + typeof(p));
	}		
};

var driver = $context.base({
	Identifier: Identifier
});

//	TODO	add test coverage for types and review this; is it redundant with standard JDBC stuff in drivers.js? Should be able to
//			get away with mostly one model for types
var types = new function() {
	var quoteIdentifier = function(string) {
		return "\"" + string + "\"";
	}

	var escapeQuote = function(string) {
		return "'" + string.replace("'", "''", "g") + "'";
	}

	var cast = function(type,value,toString) {
		if (typeof(toString) == "undefined") throw "Missing cast toString function";
		if (value == null) return "NULL";
		//	See PostgreSQL manual 4.1.2.5
		return type + " " + escapeQuote(toString(value));
		//	return "CAST (" + escapeQuote(string) + " AS " + type + ")";
	}

	var TIMESTAMP_MASK = "yyyy-MM-dd HH:mm:ss.SSS";
	var DATE_MASK = "yyyy-MM-dd";

	var $ANY = new function() {
		this.cast = function(value) {
			if (value instanceof Date) {
				return escapeQuote(new Packages.java.text.SimpleDateFormat(TIMESTAMP_MASK).format(value.getTime()));
			} else if (typeof(value) == "number") {
				return String(value);
			} else if (typeof(value) == "string") {
				return escapeQuote(value);
			} else {
				throw "Cannot cast: " + value;
			}
		}
	};

	var TIMESTAMP = new function() {
		this.string = "TIMESTAMP";
	
		this.decode = function(rs,index) {
			return new Date( rs.getTimestamp(index).getTime() );
		}
	
		this.cast = function(value) {
			return cast("TIMESTAMP", value, function(value) {
				return String(new Packages.java.text.SimpleDateFormat(TIMESTAMP_MASK).format( value.getTime() ));
			} );
		}
	}
	
	var VARCHAR = function(precision) {
		return new function() {
			this.string = "VARCHAR(" + precision + ")";
	
			this.decode = function(rs,index) {
				return String( rs.getString(index) );
			}
	
			this.cast = function(value) {
				return cast("VARCHAR", value, function(a) { return a; });
			}
		}
	}
	
	var DATE = new function() {
		var TimeZone = Packages.java.util.TimeZone;
	
		this.string = "DATE";
	
		this.decode = function(rs,index) {
			var ts = rs.getTimestamp(index);
			if (ts === null) return null;
			return new Date( rs.getTimestamp(index).getTime() );
		}
	
		var toUtc = function(value) {
			var formatter = new Packages.java.text.SimpleDateFormat(DATE_MASK);
			formatter.setTimeZone(TimeZone.getTimeZone("Universal"));
			return String(formatter.format(value.getTime()));
		}
	
		this.cast = function(value) {
			return cast("DATE", value, toUtc);
		}
	}
	
	var SMALLINT = new function() {
		this.string = "SMALLINT";
	
		this.decode = function(rs,index) {
			return Number( rs.getInt(index) );
		}
	
		this.cast = function(value) {
			return cast("SMALLINT", value, String);
		}
	}
	
	var INTEGER = new function() {
		this.string = "INTEGER";
	
		this.decode = function(rs,index) {
			return Number( rs.getInt(index) );
		}
	
		this.cast = function(value) {
			return cast("INTEGER", value, String);
		}
	}
	
	var BIGINT = new function() {
		this.string = "BIGINT";
	
		this.decode = function(rs,index) {
			return Number( rs.getLong(index) );
		}
	
		this.cast = function(value) {
			return cast("BIGINT", value, String);
		}
	}
	
	var DOUBLE = new function() {
		this.string = "DOUBLE";
	
		this.decode = function(rs,index) {
			return Number( rs.getDouble(index) );
		}
	
		this.cast = function(value) {
			return cast("DOUBLE PRECISION", value, String);
		}
	}
	
	var BOOLEAN = new function() {
		this.string = "BOOLEAN";
	
		this.decode = function(rs,index) {
			return rs.getBoolean(index);
		}
	
		this.cast = function(value) {
			return cast("BOOLEAN", value, function(v) { return (v) ? "TRUE" : "FALSE" });
		}
	}
	
	var $Types = Packages.java.sql.Types;

	this.getCodec = function(data) {
		if (data.code == $Types.VARCHAR) {
			return VARCHAR(data.precision);
		} else if (data.code == $Types.SMALLINT) {
			return SMALLINT;
		} else if (data.code == $Types.INTEGER) {
			return INTEGER;
		} else if (data.code == $Types.BIGINT) {
			return BIGINT;
		} else if (data.code == $Types.TIMESTAMP) {
			return TIMESTAMP;
		} else if (data.code == $Types.BIT) {
			return BOOLEAN;
		} else if (data.code == $Types.DATE) {
			return DATE;
		} else if (data.code == $Types.DOUBLE) {
			return DOUBLE;
		} else {
			return new function() {
				this.decode = function(rs,index) {
					return rs.getObject(index);
				}
			}
		}
	}
};
types.get = function(columnRow) {
	var $Types = Packages.java.sql.Types;

	var type = columnRow[4];

	if (type == $Types.VARCHAR) {
		return VARCHAR(columnRow[6]);
	} else if (type == $Types.SMALLINT) {
		return SMALLINT;
	} else if (type == $Types.INTEGER) {
		return INTEGER;
	} else if (type == $Types.BIT) {
		return BOOLEAN;
	} else if (type == $Types.DATE) {
		return DATE;
	} else if (type == $Types.TIMESTAMP) {
		return TIMESTAMP;
	} else if (type == $Types.DOUBLE) {
		return DOUBLE;
	} else {
		debugger;
	}
}

var dataSources = {};

var getDataSource = function(host,port,db,user,password,pool) {
	var dbid = host + "/" + port + "/" + db + "/" + user;
	if (!dataSources[dbid]) {
		//	was for 8.2
		//	var driver = (pool) ? "Jdbc3PoolingDataSource" : "Jdbc3SimpleDataSource";
		//	var ds = new Packages.org.postgresql.jdbc3[driver];
		var driverName = (pool) ? "PGPoolingDataSource" : "PGSimpleDataSource";
		var ds = new Packages.org.postgresql.ds[driverName];
		ds.serverName = host;
		ds.databaseName = db;
		ds.portNumber = Number($context.api.js.defined(port,5432));
		ds.user = user;
		ds.password = password;
		dataSources[dbid] = new driver.DataSource({
			peer: ds,
			types: types
		});
	}
	return dataSources[dbid];
}

var Database = function(o) {
	if (!o.host) o.host = "localhost";
	if (!o.port) o.port = 5432;
	
	this.toString = function() {
		return "PostgreSQL: host=" + o.host + " port=" + o.port;
	}

	var bootstrapDatasource;
	if (o.admin) {
		//	TODO	template1? template0?
		bootstrapDatasource = getDataSource(o.host,o.port,"postgres",o.admin.user,o.admin.password,false);
		if (!o.user) o.user = o.admin.user;
		if (!o.password) o.password = o.admin.password;
	}

	driver.Database.call(this, new function() {
		this.catalogs = new function() {
			if (bootstrapDatasource) this.list = function() {
				//	TODO	the pure JDBC implementation below does not work; JDBC connections are not aware
				//			of other databases; see https://jdbc.postgresql.org/development/privateapi/org/postgresql/jdbc/PgDatabaseMetaData.html#getCatalogs--
				// var query = bootstrapDatasource.createMetadataQuery(function(metadata) {
				// 	return metadata.getCatalogs();
				// });
				// var array = query.toArray();
				// return array.map( function(item) { return new Catalog(item.table_cat); } );
				var rs = bootstrapDatasource.createQuery("SELECT datname FROM pg_database");
				var array = rs.toArray();
				return array.map(function(item) {
					return { 
						name: item.datname
					};
				});
			};

			if (bootstrapDatasource) this.create = function(p) {
				bootstrapDatasource.executeStandalone("CREATE DATABASE " + p.name.sql());
			};

			if (bootstrapDatasource) this.drop = function(p) {
				bootstrapDatasource.executeStandalone("DROP DATABASE " + p.name.sql());
			}

			this.DataSource = function(p) {
				return getDataSource(o.host,o.port,p,o.user,o.password,true);
			}
		}
	});
}

$exports.Database = Database;
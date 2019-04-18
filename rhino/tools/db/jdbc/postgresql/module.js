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

var driver = $context.base({
	Identifier: function(p) {
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
	}
});

var log = $context.log;

var toValue = function(array) {
	if (array.length == 0) return null;
	if (array.length > 1) throw "More than one value in " + this;
	return array[0];
}

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

var IMPLEMENTATION = new function() {
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
	}

	var TYPES = new function() {
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
	}
	TYPES.get = function(columnRow) {
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

	this.TYPES = TYPES;

	//	args are properties for data source: server,port,superuser,superpassword
	this.Database = function(dbsettings) {
		var bootstrapDatasource = getDataSource("postgres", dbsettings.user, dbsettings.password, false);

		this.getCatalogs = function() {
			var query = bootstrapDatasource.createQuery("SELECT datname FROM pg_catalog.pg_database");
			return query.toArray().map( function(item) { return new Catalog(item[0]); } );
		}

		this.getCatalog = function(name) {
			if (this.getCatalogs) {
				//	check for existence
				var catalogs = this.getCatalogs();
				return (catalogs.some( function(item) { return item.name == name } )) ? new Catalog(name) : null;
			} else {
				//	cannot check, so just go ahead
				return new Catalog(name);
			}
		}

		this.createCatalog = function(name) {
			bootstrapDatasource.executeStandalone("CREATE DATABASE " + name);
			return this.getCatalog(name);
		}

		this.dropCatalog = function(name) {
			bootstrapDatasource.executeStandalone("DROP DATABASE " + name);
		}
	}
}
$exports.IMPLEMENTATION = IMPLEMENTATION;

var dataSources = {};

var getDataSource = function(host,port,db,user,password,pool) {
	var dbid = db + "/" + user;
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
			types: IMPLEMENTATION.TYPES
		});
	}
	return dataSources[dbid];
}

var Catalog = function(dbstring,dbsettings) {
	return function(name) {
		this.toString = function() {
			return name + " in " + dbstring;
		}

		//	used by Schema toString
		var catalogToString = this.toString;

		var dataSource = getDataSource(dbsettings.host,dbsettings.port,name,dbsettings.user,dbsettings.password,true);

		var createConnection = function() {
			return dataSource.getConnection();
		}

		this.name = name;

		var getSchemas = function(connection) {
			return connection.createMetadataQuery( function(metadata) { return metadata.getSchemas() }).toArray()
				//	TODO	PostgreSQL returns null for table_catalog; may need to revisit when generalizing to other JDBCs
				.filter( function(item) { return item.table_catalog == name || typeof(item.table_catalog === null) } )
				.map( function(item) { return new Schema(item.table_schem) });
		}

		var getSchema = function(connection,name) {
			return (getSchemas(connection).some( function(item) { return item.name == name } )) ? new Schema(name) : null;
		}

		var createSchema = function(connection,name) {
			connection.execute("CREATE SCHEMA " + name);
			return getSchema(connection,name);
		}

		var dropSchema = function(connection,name) {
			connection.execute("DROP SCHEMA " + name + " CASCADE");
		}

		var pin = function(connection,f) {
			return function() {
				var array = [ connection ];
				for (var i=0; i<arguments.length; i++) {
					array.push(arguments[i]);
				}
				return f.apply(null, array);
			}
		}

		var stateless = function(f) {
			return function() {
				var connection = createConnection();
				try {
					var rv = pin(connection,f).apply(null,arguments);
					connection.commit();
					return rv;
				} finally {
					connection.close();
				}
			}
		}

		this.getSchemas = stateless(getSchemas);
		this.getSchema = stateless(getSchema);
		this.createSchema = stateless(createSchema);
		this.dropSchema = stateless(dropSchema);

		var Context = function(schema) {
			var connection = createConnection();
			if (!schema) {
				var cwrap = function(f) {
					return pin(connection,f);
				}

				this.getSchemas = cwrap(getSchemas);
				this.getSchema = cwrap(getSchema);
				this.createSchema = cwrap(createSchema);
				this.dropSchema = cwrap(dropSchema);
			} else {
				connection.execute("SET search_path TO " + schema);
			}

			this.rows = function(sql) {
				return connection.createQuery(String(sql)).toArray();
			}

			this.row = function(sql) {
				return toValue(this.rows(String(sql)));
			}

			this.execute = function(sql) {
				connection.execute(String(sql));
			}

			this.call = function(/* name, args */) {
				var name = arguments[0];
				var array = [];
				for (var i=1; i<arguments.length; i++) {
					array.push(arguments[i]);
				}
				var sql = "SELECT " + name + "(" + array.map(function(value) {
					if (value.castLiteral) {
						return value.castLiteral;
					} else {
						return $ANY.cast(value);
					}
				} ).join(",") + ")";
				connection.execute(sql);
			}

			this.commit = function() {
				connection.commit();
			}

			this.rollback = function() {
				connection.rollback();
			}

			this.destroy = function() {
				//	Maybe we should just replace the properties with a method that throws an exception?
				for (var x in this) {
					this[x] = function() { throw "Context destroyed!" };
				}
				connection.close();
			}

			this.Type = new function() {
				var wrap = function(type) {
					return function(value) {
						return { castLiteral: type.cast(value) };
					}
				}

				this.TIMESTAMP = wrap(TIMESTAMP);
				this.SMALLINT = wrap(SMALLINT);
				this.VARCHAR = wrap(VARCHAR);
				this.BOOLEAN = wrap(BOOLEAN);
				this.DATE = wrap(DATE);
			}
		}

		var perform = function(transaction,schema) {
			var context = new Context(schema);
			try {
				transaction(context);
				context.commit();
			} finally {
				context.destroy();
			}
		}

		this.perform = function(transaction) {
			perform(transaction);
		}

		var Table = function(schemaName,tableName) {
			var qname = schemaName + "." + tableName;
			this.qname = qname;
			this.name = tableName;

			var columns = {
				map: {},
				list: []
			};

			dataSource.createMetadataQuery(
				function(metadata) { return metadata.getColumns(name,schemaName,tableName,null) }
			).toArray().forEach( function(row) {
				var type = IMPLEMENTATION.TYPES.get(row);
				if (!type) throw "No type for " + $context.api.js.toLiteral(row);
				//	TODO	list some sort of DDL here?
				var column = { name: row[3], type: type };
				columns.map[row[3]] = column;
				columns.list.push(column);
			});

			var exists = false;
			for (var x in columns.map) {
				exists = true;
			}
			this.exists = exists;

			this.columns = columns;

			//	TODO	Cannot remember why insert is not part of this object and update is.  Should both be?  Neither?
			this.row = new function() {
				var wheres = function(was) {
					var rv = [];
					for (var x in was) {
						var column = columns.map[x];
						if (column) {
							if (typeof(was[x]) == "undefined" || was[x] == null) {
								rv.push( quoteIdentifier(x) + " IS NULL" );
							} else {
								rv.push( quoteIdentifier(x) + " = " + column.type.cast(was[x]) );
							}
						}
					}
					return rv;
				}

				this.update = function(was,is) {
					var sets = [];
					for (var x in is) {
						var column = columns.map[x];
						if (column) {
							sets.push( quoteIdentifier(x) + " = " + column.type.cast(is[x]) );
						}
					}

					return <>
						UPDATE {qname} SET {sets.join(", ")} WHERE {wheres(was).join(" AND ")}
					</>;
				}

				this["delete"] = function(was) {
					return <>
						DELETE FROM {qname} WHERE {wheres(was).join(" AND ")}
					</>;
				}
			}

			this.insert = function(data) {
				var items = [];
				for (var x in data) {
					items.push({ name: x, value: data[x] });
				}
				var names = [];
				var values = [];
				items.forEach( function(item) {
					var column = columns.map[item.name];
					if (column) {
						names.push(item.name);
						values.push(column.type.cast(item.value))
					}
				} );
				return <>
					INSERT INTO {qname} ({names.map(quoteIdentifier).join(", ")}) VALUES ({values.join(", ")})
				</>;
			}
		}

		var Schema = function(name) {
			if (!name) throw new Error("No name for schema.");
			this.toString = function() {
				return name + " in " + catalogToString();
			}

			this.name = name;

			this.createContext = function() {
				return new Context(name);
			}

			this.perform = function(transaction) {
				perform(transaction,name);
			}

			this.rows = function(sql) {
				var rv;
				perform(function(db) {
					rv = db.rows(sql);
				}, name);
				return rv;
			}

			this.row = function(sql) {
				return toValue(this.rows(sql));
			}

			this.test = function() {
				var breakpoint = 1;
			}

			this.getTable = function(name) {
				var rv = new Table(this.name,name);
				return (rv.exists) ? rv : null;
			}

			this.getTables = function() {
				return dataSource.createMetadataQuery( function(metadata) {
					return metadata.getTables(null,name,null,null)
				} ).toArray().map( function(row) {
					return new Table(name,row[2]);
				} );
			}
		}
	};
}

var Database = function(o) {
	if (!o.host) o.host = "localhost";
	if (!o.port) o.port = 5432;
	
	this.toString = function() {
		return "PostgreSQL: host=" + o.host + " port=" + o.port;
	}

	if (o.admin) {
		//	TODO	template1? template0?
		var bootstrapDatasource = getDataSource(o.host,o.port,"postgres",o.admin.user,o.admin.password,false);
		if (!o.user) o.user = o.admin.user;
		if (!o.password) o.password = o.admin.password;
	}

	driver.Database.call(this, new function() {
		this.catalogs = new function() {
			this.list = function() {
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

			this.create = function(name) {
				bootstrapDatasource.executeStandalone("CREATE DATABASE " + name.sql());
			};

			this.drop = function(name) {
				bootstrapDatasource.executeStandalone("DROP DATABASE " + name.sql());
			}

			this.DataSource = function(p) {
				return getDataSource(o.host,o.port,p,o.user,o.password,true);
			}
		}
	});
}

$exports.Database = Database;
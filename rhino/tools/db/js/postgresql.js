var $js = $context.$js;
var log = $context.log;

var toValue = function(array) {
	if (array.length == 0) return null;
	if (array.length > 1) throw "More than one value in " + this;
	return array[0];
}

var IMPLEMENTATION = new function() {
	var Query = function(args) {
		var isNull = function(rs,index) {
			var ignore = rs.getString(index+1);
			return rs.wasNull();
		}

		this.toArray = function() {
			var rs = args.open();
			var metadata = rs.getMetaData();
			var count = metadata.getColumnCount();
			var columns = [];
			for (var i=0; i<count; i++) {
				columns.push({
					type: {
						code: Number(metadata.getColumnType(i+1)), 
						name: String(metadata.getColumnTypeName(i+1)),
						precision: Number(metadata.getPrecision(i+1)), 
						scale: Number(metadata.getScale(i+1))
					}, 
					name: String(metadata.getColumnName(i+1))
				});
			}
			var rv = [];
			while(rs.next()) {
				var row = {};
				columns.forEach( function(column,index) {
					var val = isNull(rs,index) ? null : TYPES.getCodec(column.type).decode(rs,index);
					row[index] = val;
					row[column.name] = val;
				} );
				rv.push(row);
			}
			args.close();
			return rv;
		}
	}

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
	
	var VARCHAR = function(precision) {
		return new function() {
			this.decode = function(rs,index) {
				return String( rs.getString(index+1) );
			}

			this.cast = function(value) {
				return cast("VARCHAR", value, function(a) { return a; });
			}
		}
	}
	
	var TIMESTAMP = new function() {
		this.decode = function(rs,index) {
			return new Date( rs.getTimestamp(index+1).getTime() );
		}
		
		this.cast = function(value) {
			return cast("TIMESTAMP", value, function(value) {
				return String(new Packages.java.text.SimpleDateFormat(TIMESTAMP_MASK).format( value.getTime() ));
			} );
		}
	}
	
	var DATE = new function() {
		var TimeZone = Packages.java.util.TimeZone;
		
		this.decode = function(rs,index) {
			return new Date( rs.getTimestamp(index+1).getTime() );
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
		this.decode = function(rs,index) {
			return Number( rs.getInt(index+1) );
		}
		
		this.cast = function(value) {
			return cast("SMALLINT", value, String);
		}
	}

	var INTEGER = new function() {
		this.decode = function(rs,index) {
			return Number( rs.getInt(index+1) );
		}

		this.cast = function(value) {
			return cast("INTEGER", value, String);
		}
	}

	var BIGINT = new function() {
		this.decode = function(rs,index) {
			return Number( rs.getLong(index+1) );
		}

		this.cast = function(value) {
			return cast("BIGINT", value, String);
		}
	}
	
	var BOOLEAN = new function() {
		this.decode = function(rs,index) {
			return rs.getBoolean(index+1);
		}
		
		this.cast = function(value) {
			return cast("BOOLEAN", value, function(v) { return (v) ? "TRUE" : "FALSE" });
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
			} else {
				return new function() {
					this.decode = function(rs,index) {
						return rs.getObject(index+1);
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
		}
	}
	
	//	args are properties for data source: server,port,superuser,superpassword
	this.Database = function(dbsettings) {
		var createQueryMethod = function(argumentsFactoryMethod) {
			return function() {
				return new Query(argumentsFactoryMethod.apply(null, arguments));
			}
		}

		var DataSource = function(peer) {
			this.getConnection = function() {
				//debugger;
				return new Connection(peer.getConnection());
			}
			
			var self = this;
			
			this.executeDdl = function(ddl) {
				try {
					var connection = self.getConnection();
					connection.executeDdl(ddl);
				} finally {
					connection.close();
				}
			}
			
			this.executeStandalone = function(ddl) {
				try {
					var connection = new Connection(peer.getConnection(), { standalone: true });
					connection.execute(ddl);
				} finally {
					connection.close();
				}
			}
			
			var createQueryArguments = function(sql) {
				return new function() {
					var connection;
					var resources;
					
					this.open = function() {
						if (!connection) {
							connection = self.getConnection();
							resources = connection.$createQueryArguments(sql);
						}
						return resources.open();
					}
					
					this.close = function() {
						try {
							resources.close();
							connection.close();
						} finally {
							resources = null;
							connection = null;
						}
					}
				}			
			}
			
			var createMetadataQueryArguments = function(resultSetFactory) {
				return new function() {
					var connection;
					var rs;

					this.open = function() {
						if (!rs) {
							connection = self.getConnection();
							rs = resultSetFactory(connection.$getMetaData());
							return rs;
						}
					}

					this.close = function() {
						try {
							rs.close();
							connection.close();
						} finally {
							rs = null;
							connection = null;
						}
					}
				}
			}
			
			this.createMetadataQuery = createQueryMethod(createMetadataQueryArguments);
			this.createQuery = createQueryMethod(createQueryArguments);
		}
		var dataSources = {};
		
		var getDataSource = function(db,user,password,pool) {
			var dbid = db + "/" + user;
			if (!dataSources[dbid]) {
				//	was for 8.2
				//	var driver = (pool) ? "Jdbc3PoolingDataSource" : "Jdbc3SimpleDataSource";
				//	var ds = new Packages.org.postgresql.jdbc3[driver];
				var driver = (pool) ? "PGPoolingDataSource" : "PGSimpleDataSource";
				var ds = new Packages.org.postgresql.ds[driver];
				ds.serverName = dbsettings.server;
				ds.databaseName = db;
				ds.portNumber = Number($js.defined(dbsettings.port,0));
				ds.user = user;
				ds.password = password;
				dataSources[dbid] = new DataSource(ds);
			}
			return dataSources[dbid];
		}
		
		var Connection = function(peer,mode) {
			if (!mode) mode = {};
			if (!mode.standalone) {
				peer.setAutoCommit(false);
			}
			
			var execute = function(sql) {
				try {
					var statement = peer.createStatement();
					if (log) log(sql);
					statement.execute(sql);
				} finally {
					statement.close();
				}
			}
			
			this.execute = execute;
			
//			this.query = function(sql) {
//				var statement = peer.createStatement();
//				var rs = peer.executeQuery(sql);
//			}
			
			var createQueryArguments = function(sql) {
				return new function() {
					var statement;
					var rs;
					
					this.open = function() {
						if (!statement) {
							if (log) log(sql);
							statement = peer.createStatement();
							try {
								rs = statement.executeQuery(sql);
							} catch (e) {
								if (e.javaException) {
									throw new Packages.java.lang.RuntimeException("Error " + e.javaException.getMessage() + " while executing \n" + sql + "\n", e.javaException);
								} else {
									throw e;
								}
							}
						}
						return rs;
					}
					
					this.close = function() {
						try {
							rs.close();
							statement.close();
						} finally {
							statement = null;
							rs = null;
						}
					}
				}
			}
			this.$createQueryArguments = createQueryArguments;
			
			var createMetadataQueryArguments = function(resultSetFactory) {
				return new function() {
					var rs;

					this.open = function() {
						if (!rs) {
							rs = resultSetFactory(peer.getMetaData());
							return rs;
						}
					}

					this.close = function() {
						try {
							rs.close();
						} finally {
							rs = null;
						}
					}
				}
			}
			
			this.createMetadataQuery = createQueryMethod(createMetadataQueryArguments);
			this.createQuery = createQueryMethod(createQueryArguments);
			
			this.close = function() {
				peer.close();
			}
			
			this.rollback = function() {
				peer.rollback();
			}
			
			this.commit = function() {
				peer.commit();
			}
			
			this.$getMetaData = function() {
				return peer.getMetaData();
			}
		}
		
		var bootstrapDatasource = getDataSource("postgres", dbsettings.user, dbsettings.password, false);

		//	This JDBC-standard implementation does not work, at least on postgresql 8.2 with 8.2 drivers.
		//	So we overwrite it with the next implementation
		this.getCatalogs = function() {
			var query = bootstrapDatasource.createMetadataQuery(function(metadata) {
				return metadata.getCatalogs();
			});
			return query.toArray().map( function(item) { return new Catalog(item[0]); } );
		}

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
			
		var Catalog = function(name) {
			var dataSource = getDataSource(name,dbsettings.user,dbsettings.password,true);
			
			var createConnection = function() {
				return dataSource.getConnection();
			}
			
			this.name = name;
			
			var getSchemas = function(connection) {
				return connection.createMetadataQuery( function(metadata) { return metadata.getSchemas() }).toArray()
					//	postgres violates JDBC standard by omitting second column here
					.filter( function(item) { return item[1] == name || typeof(item[1] == "undefined") } )
					.map( function(item) { return new Schema(item[0]) });
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
					var type = TYPES.get(row);
					if (!type) throw "No type for " + row.toSource();
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
		}
	}
}
$exports.IMPLEMENTATION = IMPLEMENTATION;

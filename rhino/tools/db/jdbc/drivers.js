//	TODO	an error message below uses $context.api.js and we should get that in ASAP to simplify some of this code
var types = new function() {
	var Types = Packages.java.sql.Types;
	
	var cast = function(to,value,toLiteral) {
		return "CAST (" + toLiteral(value) + " AS " + to + ")";
	};
	cast.binary = function(value) {
		var s = "";
		var _in = value.java.adapt();
		var _i;
		while((_i = _in.read()) != -1) {
			var _string = Packages.java.lang.Integer.toHexString(_i);
			var string = String(_string);
			var hex = string.substring(string.length-2);
			if (hex.length == 1) {
				hex = "0" + hex;
			}
			s += hex;
		}
		return "X'" + s + "'";
	};
	cast.integer = function(value) {
		return String(value);
	}

	var VARCHAR = function(precision) {
		return new function() {
			this.toString = function() {
				return "VARCHAR(" + precision + ")";
			}
			
			this.decode = function(rs,column) {
				return String(rs.getString(column));
			};
		
			this.cast = function(value) {
				return cast("VARCHAR(" + precision + ")",value,function(s) {
					//	TODO	secape
					return "'" + String(s) + "'";
				});
			}
		}
	};
	
	var LONGVARCHAR = function(precision) {
		return new function() {
			this.toString = function() {
				return "LONGVARCHAR(" + precision + ")";
			}
			
			this.decode = function(rs,column) {
				return String(rs.getString(column));
			};
		
			this.cast = function(value) {
				return cast("LONGVARCHAR(" + precision + ")",value,function(s) {
					//	TODO	secape
					return "'" + String(s) + "'";
				});
			}
		}
	};
	
	var INTEGER = new function() {
		this.toString = function() {
			return "INTEGER";
		}

		this.decode = function(rs,column) {
			return Number(rs.getLong(column));
		};
		
		this.cast = function(value) {
			return cast("INTEGER",value,function(i) {
				return String(i);
			});
		}
	};
	
	var DOUBLE = new function() {
		this.toString = function() {
			return "DOUBLE";
		}

		this.decode = function(rs,column) {
			return Number(rs.getDouble(column));
		};
		
		this.cast = function(value) {
			return cast("DOUBLE",value,function(i) {
				return String(i);
			});
		}
	};
	
	var DECIMAL = function(precision,scale) {
		this.toString = function() {
			return "DECIMAL(" + precision + "," + scale + ")";
		}

		return new function() {
			this.decode = function(rs,column) {
				var _bd = rs.getBigDecimal(column);
				return Number(_bd.toPlainString());
			}
		}
	};
	
	var TIMESTAMP = new function() {
		this.toString = function() {
			return "TIMESTAMP";
		}

		this.decode = function(rs,column) {
			return new Date( rs.getTimestamp(column).getTime() );
		}

		this.cast = function(value) {
			return cast("TIMESTAMP", value, function(value) {
				return String(new Packages.java.text.SimpleDateFormat(TIMESTAMP_MASK).format( value.getTime() ));
			} );
		}
	};
	
	var BLOB = new function() {
		this.toString = function() {
			return "BLOB";
		};
		
		this.decode = function(rs,column) {
			var _blob = rs.getBlob(column);
			//	TODO	decorate with closure method that fires when input stream closed?
			var _in = _blob.getBinaryStream();
			return new $context.api.io.InputStream(_in);
		};
		
		//	TODO	should come up with a non-cast solution for large BLOBs
		this.cast = function(value) {
			return {
				set: function(statement,parameter) {
					statement.setBinaryStream(parameter,value.java.adapt());
				}
			}
		}
	};
	
	var BIT = new function() {
		this.toString = function() {
			return "BIT";
		};
		
		this.decode = function(rs,index) {
			return Boolean(rs.getBoolean(index));
		};
		
		this.cast = function(b) {
			return cast("BIT", b, function(b) {
				return String(b);
			});
		}
	};
	
	this.getCodec = function(type) {
		if (type.code == Types.VARCHAR) return VARCHAR(type.precision);
		if (type.code == Types.INTEGER) return INTEGER;
		if (type.code == Types.SMALLINT) return INTEGER;
		if (type.code == Types.BIGINT) return INTEGER;
		if (type.code == Types.REAL) return DOUBLE;
		if (type.code == Types.LONGVARCHAR) return LONGVARCHAR(type.precision);
		if (type.code == Types.FLOAT) return DOUBLE;
		if (type.code == Types.DOUBLE) return DOUBLE;
		if (type.code == Types.TIMESTAMP) return TIMESTAMP;
		if (type.code == Types.DECIMAL) return new DECIMAL(type.precision,type.scale);
		if (type.code == Types.BLOB) return BLOB;
		if (type.code == Types.LONGVARBINARY) return BLOB;
		if (type.code == Types.BIT) return BIT;
	};
	
//	this.decode = function(type,rs,index) {
//		var isNull = function(rs,index) {
//			var ignore = rs.getString(index+1);
//			return rs.wasNull();
//		};
//		
//		if (isNull(rs,index)) return null;
//		var codec = this.getCodec(type);
//		if (!codec) {
//			throw new TypeError("No codec for type: " + type.name + " (code: " + type.code + ")");
//		}
//		return codec.decode(rs,index+1);
//	}
};

var Iterator = function(forEach) {
	this.forEach = function(callback) {
		forEach(callback);
	};
	
	this.toArray = function() {
		var rv = [];
		forEach(function(item) {
			rv.push(item);
		});
		return rv;
	};
	
	this.map = function(mapper,target) {
		return new Iterator(function(callback) {
			forEach(function(item) {
				callback(mapper.call(target,item));
			})
		});
	};
	
	this.one = function() {
		var rv = null;
		forEach(function(item) {
			if (rv) throw new Error("Query returned multiple rows");
			rv = item;
		});
		return rv;
	}
};

var NamingAlgorithmSelector = function() {
	return new function() {
		var insensitive = {};
		var sensitive = {};
		
		this.add = function(name) {
			if (!isNaN(name)) {
				sensitive = null;
				insensitive = null;
			};
			var lower = name.toLowerCase();
			if (insensitive && insensitive[lower]) {
				//	insensitive will not work
				insensitive = null;
			} else if (insensitive) {
				insensitive[lower] = true;
			}
			if (sensitive && sensitive[name]) {
				sensitive = null;
			} else if (sensitive) {
				sensitive[name] = true;
			}
		};
		
		this.select = function(algorithms) {
			if (insensitive) return algorithms.insensitive;
			if (sensitive) return algorithms.sensitive;
			return algorithms.array;
		}
	}
};

var Mapper = function(o) {
	var delegate;
	
	var array = function(types,columns) {
		return function(rs) {
			var row = [];
			columns.forEach( function(column,index) {
				row.push(types.decode(column.type,rs,index));
			} );
			return row;
		}
	};
	
	var getDefaultAlgorithm = function(columns) {
		var selector = new NamingAlgorithmSelector();
		for (var i=0; i<columns.length; i++) {
			selector.add(columns[i].name);
		}
		return selector.select({
			insensitive: function(types,columns) {
				return function(rs) {
					var row = {};
					columns.forEach( function(column,index) {
						if (!types.getCodec(column.type)) {
							throw new TypeError("No codec for " + column.type.name + " code=" + column.type.code);
						}
						row[column.name.toLowerCase()] = types.getCodec(column.type).decode(rs,index+1);
						if (rs.wasNull()) {
							row[column.name.toLowerCase()] = null;
						}
					} );
					return row;				
				}
			},
			sensitive: function(types,columns) {
				return function(rs) {
					var row = {};
					columns.forEach( function(column,index) {
						row[column.name] = types.decode(column.type,rs,index+1);
					} );
					return row;				
				}
			},
			array: function(types,columns) {
				return function(rs) {
					var row = [];
					columns.forEach( function(column,index) {
						row.push(types.getCodec(column.type).decode(rs,index+1));
					} );
					return row;
				}
			}
		});
		return array;
	}

	this.map = function(rs) {
		if (!delegate) {
			var columns = $context.api.core.rs.getColumns(rs);
			var algorithm = (o.algorithm) ? o.algorithm : getDefaultAlgorithm(columns);
			delegate = algorithm(o.types,columns);
		}
		return delegate(rs);
	};
};

var Query = function(o) {
	return new Iterator(function(f) {
		var rs = o.results.open();
		while(rs.next()) {
			var row = o.mapper.map(rs);
			f(row);
		}
		o.results.close();
	});
};

var DataSource = function(c) {
	var log = $context.log;
	//	Creates a function that calls the Query constructor with the return value of the first argument (which is a function)
	var createQueryFactory = function(Query,argumentsFactoryMethod) {
		if (!Query) throw new RangeError("No Query given.");
		return function() {
			debugger;
			return new Query({ results: argumentsFactoryMethod.apply(null, arguments), mapper: new Mapper({ types: c.types }) });
		}
	}

	var Connection = function(peer,mode) {
		if (!mode) mode = {};
		if (!mode.standalone) {
			peer.setAutoCommit(false);
		}

		var createResultSetFactoryQuery = function(rsFactory) {
			return new Query({
				results: new function() {
					var rs;

					this.open = function() {
						if (!rs) {
							rs = rsFactory();
						}
						return rs;
					};

					this.close = function() {
						try {
							rs.close();
						} finally {
							rs = null;
						}
					}
				},
				mapper: new Mapper({ types: c.types })
			});
		};
		
		var execute = function(p) {
			var sql = p.sql;
			var generated = p.generated;
			try {
				if (log) log(sql);
				
				if (generated) {
					var _names = $context.api.java.Array.create({
						type: Packages.java.lang.String,
						array: generated.map(function(s) { return new Packages.java.lang.String(s); })
					});
					var statement;
					if (!p.parameters) {
						statement = peer.createStatement();
						statement.execute(sql,_names);
					} else {
						statement = peer.prepareStatement(sql,_names);
						//	TODO	this code path is seemingly unexercised
						for (var i=0; i<p.parameters.length; i++) {
							p.parameters[i].set(statement,i+1);
						}
						statement.execute();
					}
					var query = createResultSetFactoryQuery(function() { return statement.getGeneratedKeys(); });
					return query.toArray().map(function(row) {
						return row[0];
					});
				} else {
					if (!p.parameters) {
						statement = peer.createStatement();
						statement.execute(sql);
					} else {
						statement = peer.prepareStatement(sql);
						for (var i=0; i<p.parameters.length; i++) {
							p.parameters[i].set(statement,i+1);
						}
						statement.execute();
					}
				}
			} finally {
				statement.close();
			}
		}

		this.execute = execute;
		
		this.executeDdl = execute;

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

		this.createMetadataQuery = createQueryFactory(Query,createMetadataQueryArguments);
		this.createQuery = createQueryFactory(Query,createQueryArguments);
		
		this.createQuery = function(p) {
			return new Query({ results: createQueryArguments(p.sql), mapper: (p.mapper) ? p.mapper : new Mapper({ types: c.types }) });
		}

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
		
		this.types = c.types;
	}
		
	this.getConnection = function() {
		//debugger;
		return new Connection(c.peer.getConnection());
	}

	var self = this;

	this.executeDdl = function(ddl) {
		try {
			var connection = self.getConnection();
			connection.executeDdl({ sql: ddl });
			connection.commit();
		} catch (e) {
			connection.rollback();
		} finally {
			connection.close();
		}
	}

	this.executeStandalone = function(ddl) {
		try {
			var connection = new Connection(c.peer.getConnection(), { standalone: true });
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
					connection.commit();
					connection.close();
				} finally {
					rs = null;
					connection = null;
				}
			}
		}
	}

//	this.createMetadataQuery = createQueryFactory(Query,createMetadataQueryArguments);
	this.createMetadataQuery = function(metadataToResultSet) {
		return new Query({ results: createMetadataQueryArguments(metadataToResultSet), mapper: new Mapper({ types: c.types }) });
	};
	this.createQuery = createQueryFactory(Query,createQueryArguments);
	
	this.types = c.types;
}

var Context = function(p) {
	var connection = p.connections.get();
//	var connection = createConnection();
//	if (!schema) {
//		var cwrap = function(f) {
//			return pin(connection,f);
//		}
//
//		this.getSchemas = cwrap(getSchemas);
//		this.getSchema = cwrap(getSchema);
//		this.createSchema = cwrap(createSchema);
//		this.dropSchema = cwrap(dropSchema);
//	} else {
//		connection.execute("SET search_path TO " + schema);
//	}
//
//	this.rows = function(sql) {
//		return connection.createQuery(sql).toArray();
//	}
	this.mapper = {
		name: {
			exact: new Mapper({
				types: connection.types,
				algorithm: function(types,columns) {
					return function(rs) {
						var row = {};
						columns.forEach( function(column,index) {
							row[column.name] = types.decode(column.type,rs,index);
						} );
						return row;
					};					
				}
			})
		}
//	var old = function(types,columns) {
//		return function(rs) {
//			var row = {};
//			columns.forEach( function(column,index) {
//				row[index] = types.decode(column.type,rs,index);
//				if (!isNaN(column.name)) {
//					//	TODO	if column names are numeric we have a problem, which is perhaps severe enough that we should
//					//			redesign this whole mechanism
//				} else {
//					if (true) row[column.name] = row[index];
//				}
//			} );
//			return row;
//		};
//	};
//	
	};

	this.createQuery = function(p) {
		return connection.createQuery(p);
	}
//
//	this.row = function(sql) {
//		return toValue(this.rows(String(sql)));
//	}

	this.execute = function(p) {
		return connection.execute(p);
	}
//
//	this.call = function(/* name, args */) {
//		var name = arguments[0];
//		var array = [];
//		for (var i=1; i<arguments.length; i++) {
//			array.push(arguments[i]);
//		}
//		var sql = "SELECT " + name + "(" + array.map(function(value) {
//			if (value.castLiteral) {
//				return value.castLiteral;
//			} else {
//				return $ANY.cast(value);
//			}
//		} ).join(",") + ")";
//		connection.execute(sql);
//	}

	this.commit = function() {
		connection.commit();
	}

	this.rollback = function() {
		connection.rollback();
	}

	this.destroy = function() {
		//	Maybe we should just replace the properties with a method that throws an exception?
		for (var x in this) {
			if (x != "destroy") {
				this[x] = function() { throw new Error("Context destroyed!") };
			}
		}
		p.connections.release(connection);
		connection = null;
	}

//	this.Type = new function() {
//		var wrap = function(type) {
//			return function(value) {
//				return { castLiteral: type.cast(value) };
//			}
//		}
//
//		this.TIMESTAMP = wrap(TIMESTAMP);
//		this.SMALLINT = wrap(SMALLINT);
//		this.VARCHAR = wrap(VARCHAR);
//		this.BOOLEAN = wrap(BOOLEAN);
//		this.DATE = wrap(DATE);
//	}		
};
Context.perform = function(context,transaction) {
	try {
		var rv = transaction(context);
		context.commit();
		return rv;
	} catch (e) {
		//	Use feature test and try-catch because feature is new and early versions were buggy
		if (jsh.java.log) {
			try {
				jsh.java.log.named("db").WARNING("Error executing %s", transaction.toString());
				jsh.java.log.named("db").WARNING("Stack trace: %s", e.stack);				
			} catch (loge) {
			}
		}
		context.rollback();
		throw e;
	} finally {
		context.destroy();
	}
}

//	Database methods

var Database = function(Catalog) {
	this.getCatalog = function(p) {
		var name = new Identifier(p.name);
		if (this.getCatalogs) {
			//	check for existence
			var catalogs = this.getCatalogs();
			return (catalogs.some( function(item) { return item.name.toString() == name.toString() } )) ? new Catalog(name) : null;
		} else {
			//	cannot check, so just go ahead
			return new Catalog(name);
		}
	};
};

var Identifier = function(p) {
	if (typeof(p) == "string") {
		//	TODO	enforce constraints: must begin with a letter and contain only letters, underscore characters (_), and digits
		this.toString = function() {
			return p.toUpperCase();
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
		throw new Error("Unimplemented: typeof(p) == " + typeof(p));
	}
}

var Catalog = function(c) {
	this.getSchemas = function() {
		var query = c.dataSource.createMetadataQuery(function(_metadata) {				
			return _metadata.getSchemas();
		});
		return query.map( function(row) {
			//	TODO	should parameterize Identifier constructor
			return new c.Schema({ name: new Identifier({ string: row.table_schem }) });
		}).toArray();
	};
	
	this.getSchema = function(p) {
		var name = new Identifier(p.name);
		var rv = $context.api.js.Array.choose(this.getSchemas(), function(schema) {
			return schema.name == name.toString();
		});
		if (p.descriptor) {
			if (!rv) {
				rv = this.createSchema(p);
			}
			p.descriptor.forEach(function(update) {
				if (!update.applied(rv)) {
					rv.perform(update.apply);
				}
			});
		}
		if (!rv) return null;
		return rv;
	};	
};

var Table = function(c) {
	var columns = {
		insensitive: {},
		sensitive: {},
		array: [],
		autoincrement: null
	};
	
	c.dataSource.createMetadataQuery(
		//	TODO	would not work in multi-catalog database; would need to filter on catalog
		function(metadata) { return metadata.getColumns(null,c.schema.name,c.name.toString(),null) }
	).forEach( function(row) {
//		var type = IMPLEMENTATION.TYPES.get(row);
		//	TODO	write test for scale being correct for DECIMAL types
		var type = c.dataSource.types.getCodec({ code: row.data_type, precision: row.column_size, scale: row.decimal_digits })
		if (!type) throw new Error("No type for " + row.type_name + " " + $context.api.js.toLiteral(row) + " using " + c.dataSource.types.getCodec);
		//	TODO	list some sort of DDL here?
		
		var yesno = function(s) {
			if (s == "YES") return true;
			if (s == "NO") return false;
		}
		
		var column = { name: row.column_name, type: type, generated: yesno(row.is_generatedcolumn), autoincrement: yesno(row.is_autoincrement) };
		if (column.autoincrement) {
			columns.autoincrement = column;
		}
		if (columns.insensitive) {
			var lower = row.column_name.toLowerCase();
			if (!columns.insensitive[lower]) {
				columns.insensitive[lower] = column;
			} else {
				columns.insensitive = null;
			}
		}
		columns.sensitive[row.column_name] = column;
		columns.array.push(column);
	});
	
	this.name = c.name.toString();
	
	this.getColumns = function(p) {
		return columns.array;
	};
	
	this.getColumn = function(p) {
		return columns.sensitive[p.name];
	};
	
	this.insert = function(data) {
		//	TODO	what should be done if property values are undefined?
		//	TODO	cannot insert data with lowercase column names
		//	TODO	generated keys are returned with uppercase names no matter what
		var items = $context.api.js.Object.pairs(data);
		var names = [];
		var values = [];
		var parameters;
		items.forEach( function(item) {
			var column = (function() {
				if (columns.insensitive) {
					return columns.insensitive[item.name.toLowerCase()];
				} else {
					return columns.sensitive[item.name];
				}
			})();
			if (column) {
				names.push(new Identifier({ string: column.name }).sql());
				if (!column.type.cast) {
					throw new Error("No cast in " + column.type + " with decode " + column.type.decode);
				}
				var value = column.type.cast(item.value);
				if (typeof(value) == "string") {
					values.push(value);
				} else {
					values.push("?");
					if (!parameters) parameters = [];
					parameters.push(value);
				}
			}
		} );
		//	TODO	should use metadata and Identifier to get case correct for names in these cases
		var sql = "INSERT INTO " + c.schema.name + "." + c.name.toString() 
			+ " (" + names.join(", ") + ")"
			+ " VALUES " 
			+ " (" + values.join(", ") + ")"
		;
		c.schema.perform(function(context) {
			if (columns.autoincrement) {
				var generated = context.execute({ sql: sql, parameters: parameters, generated: [columns.autoincrement.name] });
				var autoincrementName = (columns.insensitive) ? columns.autoincrement.name.toLowerCase() : columns.autoincrement.name;
				data[autoincrementName] = generated[0];
			} else {
				context.execute({ sql: sql, parameters: parameters });
			}
		});
	}
};

var Schema = function(c) {
	this.name = c.name.toString();
	
	this.perform = function(transaction) {
//		var context = new p.dataSource.SchemaContext(p.name.sql);
		var context = new c.Context();
		return Context.perform(context,transaction);
	};
	
	this.getTables = function() {
		return c.dataSource.createMetadataQuery( function(metadata) {
			//	TODO	this would not work in a multi-catalog database; would need to also filter on catalog
			return metadata.getTables(null,c.name.toString(),null,null)
		} ).map( function(row) {
			return new c.Table({ schema: this, dataSource: c.dataSource, name: new Identifier({ string: row.table_name })});
		}, this ).toArray();
	};
	
	this.getTable = function(p) {
		var tables = this.getTables();
		var rv = $context.api.js.Array.choose(tables, function(table) {
			return table.name == new Identifier(p.name).toString();
		});
		return (rv) ? rv : null;
	}
}

$exports.api = $context.api;
$exports.types = types;
$exports.Context = Context;
$exports.DataSource = DataSource;
$exports.Schema = Schema;
$exports.Table = Table;
$exports.Catalog = Catalog;
$exports.Database = Database;
$exports.Query = Query;
$exports.Identifier = Identifier;

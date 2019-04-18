var log = $context.log;

var toValue = function(array) {
	if (array.length == 0) return null;
	if (array.length > 1) throw "More than one value in " + this;
	return array[0];
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

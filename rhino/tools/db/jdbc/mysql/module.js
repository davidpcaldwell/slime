//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.db.mysql.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.db.mysql.Exports} $exports
	 */
	function(Packages,$context,$loader,$exports) {
		if ($context.jdbc) {
			var types = new function() {
				var Types = Packages.java.sql.Types;

				var Character = function(precision) {
					return new function() {
						this.decode = function(rs,index) {
							return String(rs.getString(index));
						}
					}
				};

				var CHAR = function(precision) {
					return Character(precision);
				}

				var VARCHAR = function(precision) {
					return Character(precision);
				};

				var Numeric = function() {
					this.decode = function(rs,index) {
						return Number(rs.getString(index));
					}
				};

				var Bit = function() {
					this.decode = function(rs,index) {
						return Boolean(rs.getBoolean(index));
					}
				};

				var BIGINT = new Numeric();
				var BIT = new Bit();
				var INT = new Numeric();
				var SMALLINT = new Numeric();
				var DOUBLE = new Numeric();

				this.getCodec = function(type) {
					// if (type.code == Types.VARCHAR) return VARCHAR(type.precision);
					if (type.code == Types.CHAR) return CHAR(type.precision);
					// if (type.code == Types.SMALLINT) return SMALLINT;
					// if (type.code == Types.BIGINT) return BIGINT;
					// if (type.code == Types.BIT) return BIT;
					// if (type.code == Types.INTEGER) return INT;
					// if (type.code == Types.DOUBLE) return DOUBLE;
					var rv = $context.jdbc.types.getCodec(type);
					if (rv && rv.toString() == "BIT") {
						rv.cast = (function(was) {
							return function() {
								var rv = was.apply(this,arguments);
								rv = rv.replace(/BIT/g, "SIGNED");
								return rv;
							}
						})(rv.cast);
					}
					if (rv && rv.toString() == "INTEGER") {
						rv.cast = (function(was) {
							return function() {
								var rv = was.apply(this,arguments);
								rv = rv.replace(/INTEGER/g, "SIGNED");
								return rv;
							}
						})(rv.cast);
					} else if (rv && /^VARCHAR/.test(rv.toString())) {
						rv.cast = (function(was) {
							return function() {
								var rv = was.apply(this,arguments);
								rv = rv.replace(/VARCHAR/g, "CHAR");
								return rv;
							}
						})(rv.cast);
					}
					return rv;
				};
			};

			var createDataSource = function(p,name) {
				var _dataSource = (function() {
					if (p._dataSource) return p._dataSource;
					var _ds = new Packages.com.mysql.jdbc.jdbc2.optional.MysqlDataSource();
					if (typeof(p.url) == "string") _ds.setUrl(p.url);
					if (typeof(p.host) != "undefined") _ds.setServerName(p.host);
					if (typeof(p.port) != "undefined") _ds.setPort(p.port);
					_ds.setUser(p.credentials.user);
					_ds.setPassword(p.credentials.password);
					if (name) {
						_ds.setDatabaseName(name.toString().toLowerCase());
					}
					return _ds;
				})();
				return new $context.jdbc.DataSource({
					peer: _dataSource,
					types: types
				});
			}

			var Catalog = function(p,name) {
				var ds = createDataSource(p,name);
				if (!name) {
					var c = ds.getConnection();
					name = new $context.jdbc.Identifier({ string: c.$getCatalog().toUpperCase() });
					c.close();
				}

				$context.jdbc.Catalog.call(this, {
				});

				this.getSchemas = function() {
					var only = new $context.jdbc.Schema({
						name: name,
						dataSource: ds,
						Context: function() {
							return new $context.jdbc.Context(new function() {
								this.connections = new function() {
									this.get = function() {
										return ds.getConnection();
									};

									this.release = function(connection) {
										connection.close();
									}
								}
							});
						},
						Table: function(p) {
							$context.jdbc.Table.call(this, {
								schema: p.schema,
								dataSource: p.dataSource,
								name: new $context.jdbc.Identifier({ string: p.name.toString().toUpperCase() })
							});
						}
					});
					return [only];
				};

				this.name = name;

				this.toString = function() {
					return "Catalog: " + name;
				}

				this.rows = function(sql) {
					return ds.getConnection().createQuery(sql).toArray();
				}

				this.forEachRow = function(sql,f) {
					ds.getConnection().createQuery(sql).forEach(f);
				}

				this.execute = function(sql) {
					var connection = ds.getConnection();
					var rv = connection.execute(sql);
					connection.commit();
					connection.close();
					return rv;
				};

				this.getReferencingKeys = function(name) {
					return ds.createMetadataQuery(function(metadata) {
						var table = (name) ? name : null;
						return metadata.getExportedKeys(null,null,table);
					});
				};
			}

			$exports.Catalog = function(p) {
				return new Catalog(p)
			}

			$exports.Database = function(p) {
				$context.jdbc.Database.call(this,function(name) {
					return new Catalog(p,name);
				});

				var ds = createDataSource(p);

				this.getCatalogs = function() {
					var connection = ds.getConnection();
					return connection.createMetadataQuery(function(metadata) {
						return metadata.getCatalogs();
					}).toArray().map(function(item) {
						return new Catalog(p,new $context.jdbc.Identifier({ string: item.table_cat.toUpperCase() }));
					});
				};
			}
		}

		var code = {
			/** @type { slime.jrunscript.db.mysql.local.Factory } */
			local: $loader.script("local.js")
		}

		$exports.local = code.local({
			library: $context.library
		});
	}
//@ts-ignore
)(Packages,$context,$loader,$exports);

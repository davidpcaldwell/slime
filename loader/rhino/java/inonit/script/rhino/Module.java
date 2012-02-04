//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader for rhino.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.io.*;

import org.mozilla.javascript.*;

public class Module {
	public static abstract class Code {
		private static Source createSource(File[] files) {
			try {
				java.net.URL[] urls = new java.net.URL[files.length];
				for (int i=0; i<urls.length; i++) {
					urls[i] = files[i].toURI().toURL();
				}
				ClassLoader loader = new java.net.URLClassLoader(urls, null);
				return Module.Code.Source.create(loader);
			} catch (java.io.IOException e) {
				throw new RuntimeException("Unreachable", e);
			}
		}

		public static abstract class Source {
			public static Source NULL = new Source() {
				public InputStream getResourceAsStream(String path) {
					return null;
				}
			};

			public static Source create(final ClassLoader loader) {
				return new Source() {
					public InputStream getResourceAsStream(String path) {
						return loader.getResourceAsStream(path);
					}
				};
			}

			public static Source create(final ClassLoader loader, final String prefix) {
				return new Source() {
					public InputStream getResourceAsStream(String path) {
						return loader.getResourceAsStream(prefix + path);
					}
				};
			}

			public static Source create(final Source source, final String prefix) {
				final String prepend = (prefix != null) ? (prefix + "/") : "";

				return new Source() {
					public String toString() {
						return Classes.class.getName() + " source=" + source + " prefix=" + prefix;
					}

					public InputStream getResourceAsStream(String path) throws IOException {
						return source.getResourceAsStream(prepend + path);
					}
				};
			}

			public static Source create(final java.net.URL url) {
				return new Source() {
					private java.net.URLClassLoader loader = new java.net.URLClassLoader(new java.net.URL[] { url });

					public String toString() {
						return Source.class.getName() + " url=" + url;
					}

					public InputStream getResourceAsStream(String path) {
						return loader.getResourceAsStream(path);
					}
				};
			}

			public abstract InputStream getResourceAsStream(String path) throws IOException;
		}

		public static Code create(final Source source, final String main) {
			return new Module.Code() {
				public Module.Code.Scripts getScripts() {
					return Module.Code.Scripts.create(source, main);
				}

				public Module.Code.Classes getClasses() {
					return Module.Code.Classes.create(Module.Code.Source.create(source, "$jvm/classes"));
				}
			};
		}

		public static Code create(final Source js, final String main, final Source classes) {
			return new Module.Code() {
				public Module.Code.Scripts getScripts() {
					return Module.Code.Scripts.create(js, main);
				}

				public Module.Code.Classes getClasses() {
					return Module.Code.Classes.create(classes);
				}
			};
		}

		public static Code slime(final File file, final String main) {
			return new Module.Code() {
				public String toString() {
					try {
						String rv = getClass().getName() + ": base=" + file.getCanonicalPath() + " main=" + main;
						return rv;
					} catch (IOException e) {
						return getClass().getName() + ": " + file.getAbsolutePath() + " [error getting canonical]";
					}
				}

				private Source source = createSource(new File[] { file });

				public Module.Code.Scripts getScripts() {
					return Module.Code.Scripts.create(
						source,
						main
					);
				}

				public Module.Code.Classes getClasses() {
					return Module.Code.Classes.create(Module.Code.Source.create(source, "$jvm/classes"));
				}
			};
		}

		public static Code unpacked(final File base, final String main) {
			return new Module.Code() {
				public String toString() {
					try {
						String rv = getClass().getName() + ": base=" + base.getCanonicalPath() + " main=" + main;
						return rv;
					} catch (IOException e) {
						return getClass().getName() + ": " + base.getAbsolutePath() + " [error getting canonical]";
					}
				}

				public Module.Code.Scripts getScripts() {
					return Module.Code.Scripts.create(
						createSource(new File[] { base }),
						main
					);
				}

				public Module.Code.Classes getClasses() {
					return Classes.create(Source.NULL);
				}
			};
		}

		public static abstract class Scripts {
			public static Scripts create(final Source source, final String main) {
				return new Scripts() {
					public Source getSource() {
						return source;
					}

					public String getMain() {
						return main;
					}
				};
			}

			//	TODO	Switch this method to return Source
			public abstract Source getSource();

			public abstract String getMain();

			public final InputStream getResourceAsStream(String path) throws IOException {
				return getSource().getResourceAsStream(path);
			}
		}

		public static abstract class Classes {
			public static Classes create(final Source source) {
				return new Classes() {
					public Source getSource() {
						return source;
					}
				};
			}

			public String toString() {
				return Classes.class.getName() + " source=" + getSource();
			}

//			/** @deprecated */
//			public static Classes create(final Source source, final String prefix) {
//				return create(Source.create(source, prefix));
//			}
//	
//			/** @deprecated */
//			public static Classes create(final java.net.URL url) {
//				return Classes.create(Source.create(url));
//			}

			public abstract Source getSource();

			public final InputStream getResourceAsStream(String path) throws IOException {
				return getSource().getResourceAsStream(path);
			}
		}

		public abstract Scripts getScripts();
		public abstract Classes getClasses();

		public ClassLoader getClassLoader(final ClassLoader delegate) {
			return new ClassLoader(delegate) {
				private Classes classes = Code.this.getClasses();

				public String toString() {
					return Code.class.getName() + " classes=" + classes + " delegate=" + delegate;
				}

				protected Class findClass(String name) throws ClassNotFoundException {
					try {
						String path = name.replace('.', '/') + ".class";
						InputStream in = classes.getResourceAsStream(path);
						if (in == null) throw new ClassNotFoundException(name);
						int i;
						ByteArrayOutputStream out = new ByteArrayOutputStream();
						try {
							while( (i = in.read()) != -1 ) {
								out.write(i);
							}
						} catch (NullPointerException e) {
							//	TODO	Grotesque hack; when this is JAR file which does not have this entry, this is the
							//			error that will result because of implementation of
							//			sun.net.www.protocol.jar.JarURLConnection$JarURLInputStream
							throw new ClassNotFoundException(name);
						}
						byte[] b = out.toByteArray();
						return defineClass(name, b, 0, b.length);
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}
			};
		}
	}

	private Engine engine;
	private Code code;

	Module(Engine engine, Code code) {
		this.engine = engine;
		this.code = code;
	}

	public String toString() {
		return "Module: code=" + code;
	}

	public final ClassLoader getClasses(ClassLoader delegate) {
		return code.getClassLoader(delegate);
	}

	public final Module.Code.Classes getClasses() {
		return code.getClasses();
	}

	//	Used by rhino loader
	public String getMainScriptPath() {
		return code.getScripts().getMain();
	}

	private class MyScript {
		private String name;

		MyScript(String name) {
			this.name = name;
		}

		public String getName() {
			if (name == null) return "<" + code.getScripts().getMain() + ">";
			return name;
		}

		InputStream getInputStream() throws IOException {
			if (name == null) return code.getScripts().getResourceAsStream(code.getScripts().getMain());
			return code.getScripts().getResourceAsStream(name);
		}

		public Reader getReader() throws IOException {
			InputStream in = getInputStream();
			if (in != null) return new InputStreamReader(in);
			return null;
		}
	}

	public InputStream read(String path) throws IOException {
		MyScript script = new MyScript(path);
		return script.getInputStream();
	}

	public static class ScriptNotFound extends Exception {
		private Code source;
		private String name;

		ScriptNotFound(Code source, String name) {
			this.source = source;
			this.name = name;
		}

		public String getMessage() {
			return "Script " + name + " not found in " + source;
		}
	}

	private void execute(Scriptable scope, MyScript script) throws IOException, ScriptNotFound {
		Reader reader = script.getReader();
		if (reader == null) {
			throw new ScriptNotFound(code, script.getName());
		}
		engine.include(scope, Engine.Source.create(code.toString() + ":" + script.getName(), reader));
	}

	public void initialize(Scriptable scope) throws IOException, ScriptNotFound {
		execute(scope, new MyScript(null));
	}

	public void execute(Scriptable scope, String name) throws IOException, ScriptNotFound {
		MyScript script = new MyScript(name);
		execute(scope, script);
	}
//
//	public Scriptable evaluate(String path) {
//		MyScript script = new MyScript(path);
//		Reader reader = script.getReader();
//		if (reader == null) {
//			throw new ScriptNotFound(code, path);
//		}
//		return engine.evaluate(source, reader)
//	}
}
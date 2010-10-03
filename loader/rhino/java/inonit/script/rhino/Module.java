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
		public static abstract class Source {
			public static Source create(final ClassLoader loader) {
				return new Source() {
					public InputStream getResourceAsStream(String path) {
						return loader.getResourceAsStream(path);
					}
				};
			}

			public abstract InputStream getResourceAsStream(String path) throws IOException;
		}

		public static abstract class Scripts {
			public static Scripts create(final Source source, final String main) {
				return new Scripts() {
					public InputStream getResourceAsStream(String path) throws IOException {
						return source.getResourceAsStream(path);
					}

					public String getMain() {
						return main;
					}
				};
			}

			public abstract InputStream getResourceAsStream(String path) throws IOException;
			public abstract String getMain();
		}

		public static abstract class Classes {
			public static Classes create(final Source source, String prefix) {
				final String prepend = (prefix != null) ? (prefix + "/") : "";

				return new Classes() {
					public InputStream getResourceAsStream(String path) throws IOException {
						return source.getResourceAsStream(prepend + path);
					}
				};
			}

			public abstract InputStream getResourceAsStream(String path) throws IOException;
		}

		public abstract Scripts getScripts();
		public abstract Classes getClasses();

		public ClassLoader getClassLoader() {
			return new ClassLoader() {
				protected Class findClass(String name) throws ClassNotFoundException {
					try {
						String path = name.replace('.', '/') + ".class";
						InputStream in = Code.this.getClasses().getResourceAsStream(path);
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

	public final ClassLoader getClasses() {
		return code.getClassLoader();
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

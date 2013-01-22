//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
import java.util.*;
import java.net.*;

import org.mozilla.javascript.*;

public abstract class Loader {
	public abstract String getPlatformCode() throws IOException;
	public abstract String getRhinoCode() throws IOException;

	//	TODO	verify whether this class needs to be public in order to be used by script calls
	public static class Bootstrap {
		private Engine engine;
		private Loader loader;

		Bootstrap(Engine engine, Loader loader) {
			this.engine = engine;
			this.loader = loader;
		}

		public String getPlatformCode() throws IOException {
			return loader.getPlatformCode();
		}

		public Classpath getClasspath() {
			return engine.getApplicationClassLoader().toScriptClasspath();
		}

		public void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
			engine.script(name, in, scope, target);
		}
	}

	//	Used in literal.js to support operations on the class loader
	public static abstract class Classpath {
		public abstract void append(Code.Source code);

		/**
			Should return the class with the given name, or <code>null</code> if there is no such class.
		*/
		public abstract Class getClass(String name);

		public final void append(Code code) {
			append(code.getClasses());
		}
	}

	public static abstract class Classes extends ClassLoader {
		public static Classes create(ClassLoader delegate) {
			return new New(delegate);
		}

		public abstract Loader.Classpath toScriptClasspath();

		Classes() {
			super();
		}

		Classes(ClassLoader delegate) {
			super(delegate);
		}

		private static class New extends Classes {
			private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
			private ArrayList<Code.Source> locations = new ArrayList<Code.Source>();

			New(ClassLoader delegate) {
				super(delegate);
			}
			
			public String toString() {
				String rv = getClass().getName() + ": locations=[";
				for (int i=0; i<locations.size(); i++) {
					rv += locations.get(i);
					if (i+1 != locations.size()) {
						rv += ",";
					}
				}
				rv += "]";
				return rv;
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				String path = name.replace('.', '/') + ".class";
				String[] tokens = name.split("\\.");
				String packageName = tokens[0];
				for (int i=1; i<tokens.length-1; i++) {
					packageName += "." + tokens[i];
				}
				for (Code.Source source : locations) {
					try {
						InputStream in = source.getResourceAsStream(path);
						if (in != null) {
							if (getPackage(packageName) == null) {
								definePackage(packageName,null,null,null,null,null,null,null);
							}
							byte[] b = streams.readBytes(in);
							return defineClass(name, b, 0, b.length);
						}
					} catch (IOException e) {
						//	do nothing
					}
				}
				throw new ClassNotFoundException(name);
			}

			protected URL findResource(String name) {
				for (Code.Source source : locations) {
					Code.Classes classes = source.getClasses();
					if (classes != null) {
						URL url = classes.getResource(name);
						if (url != null) {
							return url;
						}
					}
				}
				return null;
			}

			public Loader.Classpath toScriptClasspath() {
				return new Loader.Classpath() {
					@Override public String toString() {
						return "Loader.Classpath for: " + New.this.toString();
					}
					
					@Override public void append(Code.Source code) {
						locations.add(code);
					}

					@Override public Class getClass(String name) {
						try {
							return New.this.loadClass(name);
						} catch (ClassNotFoundException e) {
							return null;
						}
					}
				};
			}
		}
	}

	public static Scriptable load(Engine engine, Loader loader) throws IOException {
		Engine.Program program = new Engine.Program();
		program.set(Engine.Program.Variable.create("$bootstrap", Engine.Program.Variable.Value.create(new Bootstrap(engine,loader))));
		program.add(Engine.Source.create("<rhino loader>", loader.getRhinoCode()));
		return (Scriptable)engine.execute(program);
	}
}
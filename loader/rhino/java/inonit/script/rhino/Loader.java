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

	public abstract Classpath getClasspath();

	protected abstract Engine getEngine();

//	public void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
//		getEngine().script(name, in, scope, target);
//	}

	//	TODO	verify whether this class needs to be public in order to be used by script calls
	public static class Bootstrap {
		private Loader loader;

		Bootstrap(Loader loader) {
			this.loader = loader;
		}

		public String getPlatformCode() throws IOException {
			return loader.getPlatformCode();
		}

		public Classpath getClasspath() {
			return loader.getClasspath();
		}

		public void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
			loader.getEngine().script(name, in, scope, target);
		}
	}
	
	public static abstract class Classes extends ClassLoader {
		public static Classes create(ClassLoader delegate) {
			return new New(delegate);
		}
		
		public abstract Loader.Classpath toLoaderClasspath();
		
		Classes() {
			super();
		}
		
		Classes(ClassLoader delegate) {
			super(delegate);
		}
		
		private static class Old extends Classes {
			private ClassLoader current;

			Old(ClassLoader delegate) {
				this.current = delegate;
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				return current.loadClass(name);
			}

			public Loader.Classpath toLoaderClasspath() {
				return new Loader.Classpath() {
					@Override public void append(Code.Source classes) {
						current = classes.getClassLoader(current);
					}

					@Override public Class getClass(String name) {
						try {
							return Old.this.loadClass(name);
						} catch (ClassNotFoundException e) {
							return null;
						}
					}
				};
			}			
		}
		
		private static class New extends Classes {
			private ArrayList<Code.Source> locations = new ArrayList<Code.Source>();
			
			New(ClassLoader delegate) {
				super(delegate);
			}
			
			protected Class findClass(String name) throws ClassNotFoundException {
				for (Code.Source source : locations) {
					String path = name.replace('.', '/') + ".class";
					try {
						InputStream in = source.getResourceAsStream(path);
						if (in != null) {
							String[] tokens = name.split("\\.");
							String packageName = tokens[0];
							for (int i=1; i<tokens.length-1; i++) {
								packageName += "." + tokens[i];
							}
							if (getPackage(packageName) == null) {
								definePackage(packageName,null,null,null,null,null,null,null);
							}
							byte[] b = new inonit.script.runtime.io.Streams().readBytes(in);
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
			
			public Loader.Classpath toLoaderClasspath() {
				return new Loader.Classpath() {
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
	
	public static Scriptable load(Loader loader) throws IOException {
		Engine.Program program = new Engine.Program();
		program.set(Engine.Program.Variable.create("$bootstrap", Engine.Program.Variable.Value.create(new Bootstrap(loader))));
		program.add(Engine.Source.create("<rhino loader>", loader.getRhinoCode()));
		return (Scriptable)loader.getEngine().execute(program);		
	}
}

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
			return new Old(delegate);
		}
		
		public abstract Loader.Classpath toLoaderClasspath();
		
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
	}
	
	public static Scriptable load(Loader loader) throws IOException {
		Engine.Program program = new Engine.Program();
		program.set(Engine.Program.Variable.create("$bootstrap", Engine.Program.Variable.Value.create(new Bootstrap(loader))));
		program.add(Engine.Source.create("<rhino loader>", loader.getRhinoCode()));
		return (Scriptable)loader.getEngine().execute(program);		
	}
}

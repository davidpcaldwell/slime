//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.util.*;
import java.net.*;

import inonit.script.engine.*;

public abstract class Loader {
	public abstract String getCoffeeScript();
	public abstract String getLoaderCode(String path) throws IOException;

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
				synchronized(locations) {
					for (int i=0; i<locations.size(); i++) {
						rv += locations.get(i);
						if (i+1 != locations.size()) {
							rv += ",";
						}
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
				synchronized(locations) {
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
				}
				throw new ClassNotFoundException(name);
			}

			protected URL findResource(String name) {
				synchronized(locations) {
					for (Code.Source source : locations) {
						Code.Classes classes = source.getClasses();
						if (classes != null) {
							URL url = classes.getResource(name);
							if (url != null) {
								return url;
							}
						}
					}
				}
				return null;
			}

			protected Enumeration<URL> findResources(String name) {
				java.util.Vector rv = new java.util.Vector();
				synchronized(locations) {
					for (Code.Source source : locations) {
						Code.Classes classes = source.getClasses();
						if (classes != null) {
							URL url = classes.getResource(name);
							if (url != null) {
								rv.add(url);
							}
						}
					}
				}
				return rv.elements();
			}

			public Loader.Classpath toScriptClasspath() {
				return new Loader.Classpath() {
					@Override public String toString() {
						return "Loader.Classpath for: " + New.this.toString();
					}

					@Override public void append(Code.Source code) {
						synchronized(locations) {
							locations.add(code);
						}
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
}
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
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public abstract class Loader {
	private static final Logger LOG = Logger.getLogger(Loader.class.getName());

	public abstract String getCoffeeScript() throws IOException;
	public abstract String getLoaderCode(String path) throws IOException;

	public static abstract class Classes {
		public static abstract class Configuration {
			public abstract boolean canCreateClassLoaders();
			public abstract ClassLoader getApplicationClassLoader();
		}

		public static abstract class Interface {
			public abstract void append(Code.Source code);

			/**
				Should return the class with the given name, or <code>null</code> if there is no such class.
			*/
			public abstract Class getClass(String name);

			public final void append(Code code) {
				append(code.getClasses());
			}
		}

		public abstract ClassLoader getApplicationClassLoader();
		public abstract Interface getInterface();

		public static Classes create(Configuration configuration) {
			if (configuration.canCreateClassLoaders()) {
				final ClassLoaderImpl loaderClasses = ClassLoaderImpl.create(configuration.getApplicationClassLoader());
				return new Classes() {
					@Override public ClassLoader getApplicationClassLoader() {
						return loaderClasses;
					}

					@Override public Interface getInterface() {
						return loaderClasses.toInterface();
					}
				};
			} else {
				final ClassLoader loader = configuration.getApplicationClassLoader();
				return new Classes() {
					@Override public ClassLoader getApplicationClassLoader() {
						return loader;
					}

					@Override public Interface getInterface() {
						return null;
					}
				};
			}
		}

		private static class ClassLoaderImpl extends ClassLoader {
			static ClassLoaderImpl create(ClassLoader delegate) {
				LOG.log(Level.FINE, "Creating Loader.Classes: parent=%s", delegate);
				return new ClassLoaderImpl(delegate);
			}

			private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
			private ArrayList<Code.Source> locations = new ArrayList<Code.Source>();

			private ClassLoaderImpl(ClassLoader delegate) {
				super(delegate);
			}

			public String toString() {
				String rv = getClass().getName() + ": delegate=" + this.getParent() + " locations=[";
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
							Code.Source.File in = source.getFile(path);
							if (in != null) {
								if (getPackage(packageName) == null) {
									definePackage(packageName,null,null,null,null,null,null,null);
								}
								byte[] b = streams.readBytes(in.getInputStream());
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
				java.util.Vector<URL> rv = new java.util.Vector<URL>();
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

			Classes.Interface toInterface() {
				return new Classes.Interface() {
					@Override public String toString() {
						return "Loader.Classes.Interface for: " + ClassLoaderImpl.this.toString();
					}

					@Override public void append(Code.Source code) {
						synchronized(locations) {
							locations.add(code);
						}
					}

					@Override public Class getClass(String name) {
						try {
							return ClassLoaderImpl.this.loadClass(name);
						} catch (ClassNotFoundException e) {
							return null;
						}
					}
				};
			}
		}
	}
}
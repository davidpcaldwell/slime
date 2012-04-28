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

public abstract class Code {
	private static Source createSource(File[] files) {
		try {
			java.net.URL[] urls = new java.net.URL[files.length];
			for (int i = 0; i < urls.length; i++) {
				urls[i] = files[i].toURI().toURL();
			}
			ClassLoader loader = new java.net.URLClassLoader(urls, null);
			return Source.create(loader);
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
				@Override public String toString() {
					return "Source: loader=" + loader;
				}

				public InputStream getResourceAsStream(String path) {
					return loader.getResourceAsStream(path);
				}
			};
		}

		public static Source create(final ClassLoader loader, final String prefix) {
			return new Source() {
				@Override public String toString() {
					return "Source: prefix=" + prefix + " loader=" + loader;
				}

				public InputStream getResourceAsStream(String path) {
					return loader.getResourceAsStream(prefix + path);
				}
			};
		}

		public static Source create(final Source source, final String prefix) {
			//	TODO	should figure out /; maybe should only add it if we don't already end in it
			final String prepend = (prefix != null) ? (prefix + "/") : "";
			return new Source() {
				@Override public String toString() {
					return Source.class.getName() + " source=" + source + " prefix=" + prefix;
				}

				public InputStream getResourceAsStream(String path) throws IOException {
					return source.getResourceAsStream(prepend + path);
				}
			};
		}

		public static Source create(final java.net.URL url) {
			return new Source() {
				private java.net.URLClassLoader loader = new java.net.URLClassLoader(new java.net.URL[]{url});

				public String toString() {
					return Source.class.getName() + " url=" + url;
				}

				public InputStream getResourceAsStream(String path) {
					return loader.getResourceAsStream(path);
				}
			};
		}

		public static Source create(File file) throws java.net.MalformedURLException {
			return create(file.toURI().toURL());
		}

		public abstract InputStream getResourceAsStream(String path) throws IOException;
	}

	public static Code create(final Source source) {
		return new Code() {
			@Override public String toString() {
				return getClass().getName() + " source=" + source;
			}

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return Source.create(source, "$jvm/classes");
			}
		};
	}

	public static Code create(final Source js, final Source classes) {
		return new Code() {
			@Override public String toString() {
				return getClass().getName() + " js=" + js + " classes=" + classes;
			}

			public Source getScripts() {
				return js;
			}

			public Source getClasses() {
				return classes;
			}
		};
	}

	public static Code slime(final File file) {
		return new Code() {
			public String toString() {
				try {
					String rv = getClass().getName() + ": slime=" + file.getCanonicalPath();
					return rv;
				} catch (IOException e) {
					return getClass().getName() + ": " + file.getAbsolutePath() + " [error getting canonical]";
				}
			}
			private Source source = createSource(new File[]{file});

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return Source.create(source, "$jvm/classes");
			}
		};
	}

	public static Code unpacked(final File base) {
		return new Code() {
			public String toString() {
				try {
					String rv = getClass().getName() + ": base=" + base.getCanonicalPath();
					return rv;
				} catch (IOException e) {
					return getClass().getName() + ": " + base.getAbsolutePath() + " [error getting canonical]";
				}
			}

			public Source getScripts() {
				return createSource(new File[] { base });
			}

			public Source getClasses() {
				return Source.NULL;
			}
		};
	}

	public abstract Source getScripts();
	public abstract Source getClasses();

	public ClassLoader getClassLoader(final ClassLoader delegate) {
		return new ClassLoader(delegate) {
			private Source classes = Code.this.getClasses();

			public String toString() {
				return Code.class.getName() + " classes=" + classes + " delegate=" + delegate;
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				try {
					String path = name.replace('.', '/') + ".class";
					InputStream in = classes.getResourceAsStream(path);
					if (in == null) {
						throw new ClassNotFoundException(name);
					}
					int i;
					ByteArrayOutputStream out = new ByteArrayOutputStream();
					try {
						while ((i = in.read()) != -1) {
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

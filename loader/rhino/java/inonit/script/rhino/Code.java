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
import java.net.*;

public abstract class Code {
	public static abstract class Classes {
		public abstract URL getResource(String path);
	}

//	private static Source createSource(File[] files) {
//		try {
//			java.net.URL[] urls = new java.net.URL[files.length];
//			for (int i = 0; i < urls.length; i++) {
//				urls[i] = files[i].toURI().toURL();
//			}
//			ClassLoader loader = new java.net.URLClassLoader(urls, null);
//			return Source.create(loader);
//		} catch (java.io.IOException e) {
//			throw new RuntimeException("Unreachable", e);
//		}
//	}

	public static abstract class Source {
		public static Source NULL = new ResourceBased() {
			public InputStream getResourceAsStream(String path) {
				return null;
			}
		};

		public static Source system(final String prefix) {
			return new ResourceBased() {
				@Override public String toString() {
					return "Source: prefix=" + prefix + " loader=" + ClassLoader.getSystemClassLoader();
				}

				public InputStream getResourceAsStream(String path) {
					return ClassLoader.getSystemClassLoader().getResourceAsStream(prefix + path);
				}
			};
		}

//		public static Source create(final ClassLoader loader) {
//			return new Source() {
//				@Override public String toString() {
//					return "Source: loader=" + loader;
//				}
//
//				public InputStream getResourceAsStream(String path) {
//					return loader.getResourceAsStream(path);
//				}
//			};
//		}
//
//		public static Source create(final ClassLoader loader, final String prefix) {
//			return new Source() {
//				@Override public String toString() {
//					return "Source: prefix=" + prefix + " loader=" + loader;
//				}
//
//				public InputStream getResourceAsStream(String path) {
//					return loader.getResourceAsStream(prefix + path);
//				}
//			};
//		}
//
		//	public because used within script for servlet launching to load associated servlet classes; alternative would be to
		//	create a loader and load the servlet classes from that
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

				public Classes getClasses() {
					final Classes delegate = source.getClasses();
					if (delegate == null) {
						return null;
					}
					return new Classes() {
						@Override public URL getResource(String path) {
							return delegate.getResource(prepend+path);
						}
					};
				}

				public ClassLoader getClassLoader(ClassLoader delegate) {
					throw new RuntimeException("Unused?");
				}
			};
		}

		public static Source create(final java.net.URL url) {
			return new UrlBased(url);
		}

		public static Source create(File file) {
			try {
				return create(file.toURI().toURL());
			} catch (java.net.MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public static abstract class Resources {
			public abstract InputStream getResourceAsStream(String path) throws IOException;
		}

		public static Source create(final Resources resources) {
			return new ResourceBased() {
				@Override public String toString() {
					return Code.Source.class.getName() + " resources=" + resources;
				}

				@Override public InputStream getResourceAsStream(String path) throws IOException {
					return resources.getResourceAsStream(path);
				}

				@Override public Classes getClasses() {
					return null;
				}
			};
		}

		public abstract InputStream getResourceAsStream(String path) throws IOException;
		public abstract Classes getClasses();

		private static class UrlBased extends Source {
			private java.net.URL url;

			UrlBased(java.net.URL url) {
				this.url = url;
			}

			@Override public String toString() {
				return Code.Source.class.getName() + " url=" + url;
			}

			public InputStream getResourceAsStream(String path) {
				URL url = getClasses().getResource(path);
				if (url != null) {
					try {
						return url.openStream();
					} catch (IOException e) {
						//	if we cannot open it, returning null seems fine
					}
				}
				return null;
			}

			public Classes getClasses() {
				return new Classes() {
					private java.net.URLClassLoader delegate = new java.net.URLClassLoader(new java.net.URL[] {url});

					@Override public URL getResource(String path) {
						return delegate.getResource(path);
					}
				};
			}
		}

		private static abstract class ResourceBased extends Source {
			public Classes getClasses() {
				return null;
			}
		}
	}

	private static Code create(final Code.Source source) {
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

	public static Code system(final String prefix) {
		final Source source = Source.system(prefix);
		return create(source);
	}

	public static Code create(final Code.Source source, final String prefix) {
		Code.Source s = Code.Source.create(source, prefix);
		return create(s);
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
			private Source source = Source.create(file);

			public Source getScripts() {
				return source;
			}

			public Source getClasses() {
				return Source.create(source, "$jvm/classes");
			}
		};
	}

	public static Code unpacked(final File base) {
		if (!base.isDirectory()) {
			throw new IllegalArgumentException(base + " is not a directory.");
		}
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
				return Source.create(base);
			}

			public Source getClasses() {
				return Source.NULL;
			}
		};
	}

	public static Code jar(final File jar) {
		return new Code() {
			public Source getScripts() {
				return null;
			}

			public Source getClasses() {
				return Source.create(jar);
			}
		};
	}

	public abstract Source getScripts();
	public abstract Source getClasses();
}
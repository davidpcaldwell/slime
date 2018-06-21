//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;
import java.util.*;
import java.util.logging.*;

public class Logging {
	private static Logging singleton = new Logging();

	public static Logging get() {
		return singleton;
	}

	public boolean isSpecified() {
		return (System.getProperty("java.util.logging.config.file") != null || System.getProperty("java.util.logging.config.class") != null);
	}

	public void initialize(Properties properties) {
		try {
			ByteArrayOutputStream buffer = new ByteArrayOutputStream();
			properties.store(buffer, null);
			buffer.close();
			byte[] encoded = buffer.toByteArray();
			ByteArrayInputStream stream = new ByteArrayInputStream(encoded);
			LogManager.getLogManager().readConfiguration(stream);
			stream.close();
		} catch (IOException e) {
			throw new RuntimeException("Unreachable", e);
		}
	}

	//	Commented out because, although it is desirable, it causes massive compilation confusion. The below method can be used with
	//	a null Throwable
//	public void log(Class logging, Level level, String mask, Object... substitutions) {
//		Logger logger = Logger.getLogger(logging.getName());
//		if (logger.isLoggable(level)) {
//			String message = String.format(mask, substitutions);
//			logger.log(level, message);
//		}
//	}

	public void log(Class logging, Level level, String message, Throwable throwable) {
		Logger logger = Logger.getLogger(logging.getName());
		if (logger.isLoggable(level)) {
			logger.log(level, message, throwable);
		}
	}

	private static class StackTraceThrowable extends RuntimeException {
		StackTraceThrowable() {
			super("Stack trace");
		}
	}

	public static abstract class StackTracer {
		public static final StackTracer DEFAULT = new StackTracer() {
			public Throwable create(String message) {
				return new Throwable(message);
			}
		};

		public abstract Throwable create(String message);
	}

	public void logStackTrace(Class logging, Level level, String message) {
		Logger logger = Logger.getLogger(logging.getName());
		if (logger.isLoggable(level)) {
			logger.log(level, message, new StackTraceThrowable());
		}
	}

	public static class InputStream extends java.io.InputStream {
		private static final Logger LOG = Logger.getLogger(Logging.class.getName());

		private static void log(Level level, String mask, Object... substitutions) {
			LOG.log(level, mask, substitutions);
		}

		private java.io.InputStream in;
		private boolean wasSystemIn = false;

		public InputStream(java.io.InputStream in) {
			this.in = new java.io.BufferedInputStream(in);
			this.wasSystemIn = (in == System.in);
		}

		@Override public String toString() {
			if (wasSystemIn) {
				return super.toString() + " delegate=System.in";
			} else {
				return super.toString() + " delegate=" + in;
			}
		}

		@Override public int read() throws IOException {
			try {
				int rv = in.read();
				log(Level.FINEST, "Read byte: %d", rv);
				Logging.get().logStackTrace(InputStream.class, Level.FINEST, "read()");
				return rv;
			} catch (IOException e) {
				Logging.get().log(InputStream.class, Level.SEVERE, "Error in read()", e);
				throw e;
			}
		}

		@Override public int read(byte[] b) throws IOException {
			try {
				int rv = in.read(b);
				log(Level.FINEST, "Read %d bytes into array.", rv);
				Logging.get().logStackTrace(InputStream.class, Level.FINEST, "read(byte[])");
				for (int i=0; i<rv; i++) {
					log(Level.FINEST, "Read byte: %d", b[i]);
				}
				return rv;
			} catch (IOException e) {
				Logging.get().log(InputStream.class, Level.SEVERE, "Error in read(byte[])", e);
				throw e;
			}
		}

		@Override public int read(byte[] b, int off, int len) throws IOException {
			try {
				int rv = in.read(b, off, len);
				log(Level.FINEST, "Read %d bytes into array.", rv);
				Logging.get().logStackTrace(InputStream.class, Level.FINEST, "read(byte[],int,int)");
				for (int i=0; i<rv; i++) {
					log(Level.FINEST, "Read byte: %d", b[i+off]);
				}
				return rv;
			} catch (IOException e) {
				Logging.get().log(InputStream.class, Level.SEVERE, "Error in read(byte[],int,int)", e);
				throw e;
			}
		}

		@Override public long skip(long n) throws IOException {
			return in.skip(n);
		}

		@Override public int available() throws IOException {
			return in.available();
		}

		@Override public void close() throws IOException {
			log(Level.FINEST, "Closing %s with delegate %s", this, this.in);
			if (!wasSystemIn) {
				in.close();
			}
			log(Level.FINEST, "Closed %s with delegate %s", this, this.in);
		}

		@Override public synchronized void mark(int readlimit) {
			in.mark(readlimit);
		}

		@Override public synchronized void reset() throws IOException {
			in.reset();
		}

		@Override public boolean markSupported() {
			return in.markSupported();
		}
	}

	public static class OutputStream extends java.io.OutputStream {
		private static final Logger LOG = Logger.getLogger(OutputStream.class.getName());

		private java.io.OutputStream delegate;
		private String name;

		public OutputStream(java.io.OutputStream delegate, String name) {
			this.delegate = delegate;
			this.name = name;
		}

		private void log(Level level, String mask, Object... substitutions) {
			LOG.log(level, name + ": " + mask, substitutions);
		}

		@Override public void write(int b) throws IOException {
			delegate.write(b);
			log(Level.FINEST, "Wrote byte %d.", b);
		}

		@Override public void close() throws IOException {
			log(Level.FINEST, "Closing...");
			delegate.close();
			log(Level.FINE, "Closed.");
		}

		@Override public void flush() throws IOException {
			log(Level.FINEST, "Flushing ...");
			delegate.flush();
			log(Level.FINEST, "Flushed.");
		}

		@Override public void write(byte[] b, int off, int len) throws IOException {
			log(Level.FINEST, "Writing %d bytes starting with %d in array of length %d.", len, off, b.length);
			for (int i=0; i<len; i++) {
				log(Level.FINEST, "Byte %d/%d: %d", i, len, b[off+i]);
			}
			delegate.write(b, off, len);
			log(Level.FINEST, "Wrote %d bytes from buffer.", len);
		}

		@Override public void write(byte[] b) throws IOException {
			log(Level.FINEST, "Writing %d bytes", b.length);
			for (int i=0; i<b.length; i++) {
				log(Level.FINEST, "Byte %d/%d: %d", i, b.length, b[i]);
			}
			delegate.write(b);
			log(Level.FINEST, "Wrote %d bytes", b.length);
		}
	}
}
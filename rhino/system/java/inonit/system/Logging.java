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
	
	public void log(Class logging, Level level, String mask, Object... substitutions) {
		Logger logger = Logger.getLogger(logging.getName());
		if (logger.isLoggable(level)) {
			String message = String.format(mask, substitutions);
			logger.log(level, message);
		}
	}
	
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
}

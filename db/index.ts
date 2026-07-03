export * from './schema';
export * from './client';
export * from './audit';

// Re-export the query operators so consumers use this package's single
// drizzle-orm instance (avoids dual-instance type conflicts).
export { eq, and, or, not, sql, desc, asc, inArray, isNull } from 'drizzle-orm';

export * from './schema';
export * from './client';
export * from './audit';

// Re-export the query operators so consumers use this package's single
// drizzle-orm instance (avoids dual-instance type conflicts).
export {
  eq,
  ne,
  and,
  or,
  not,
  sql,
  desc,
  asc,
  inArray,
  isNull,
  isNotNull,
  gte,
  lte,
  count,
  countDistinct,
  ilike,
} from 'drizzle-orm';

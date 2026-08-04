// Stub for the `server-only` package so unit tests can import server modules.
// The real package throws on import outside a server context, which would make
// any server-side helper untestable.
export {};

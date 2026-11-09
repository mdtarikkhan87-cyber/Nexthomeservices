// Rejects any request that carries a NUL character (\u0000) anywhere a client
// can put text: the URL path (including percent-encoded %00), the query
// string, and the parsed JSON body (values AND keys, at any depth).
//
// Why centrally: PostgreSQL cannot store a NUL in a text column, so such a
// value used to reach the database layer and come back as an unhandled error
// (a 500 and a logged stack trace), on every endpoint that touches text. It is
// never legitimate input, so it is refused once, here, with a clean 400,
// before any route or validator runs. New endpoints are covered automatically.
//
// Mounted after express.json() (so the body is parsed) and after the global
// rate limiter (so refused requests still count against it).

const NUL = "\u0000";
const MAX_DEPTH = 32;

function hasNul(value, depth = 0) {
  if (typeof value === "string") return value.includes(NUL);
  if (value === null || typeof value !== "object" || Buffer.isBuffer(value)) return false;
  // Deeper than any real payload: treat as hostile rather than walk it.
  if (depth > MAX_DEPTH) return true;
  if (Array.isArray(value)) return value.some((v) => hasNul(v, depth + 1));
  return Object.entries(value).some(([k, v]) => k.includes(NUL) || hasNul(v, depth + 1));
}

function rejectNulBytes(req, res, next) {
  let path = req.path;
  try {
    path = decodeURIComponent(req.path);
  } catch {
    // A malformed percent-escape (e.g. "%zz") is not ours to interpret here.
  }
  if (path.includes(NUL) || hasNul(req.query) || hasNul(req.body)) {
    return res.status(400).json({ message: "Invalid request: the text contains an unsupported character." });
  }
  next();
}

module.exports = { rejectNulBytes };

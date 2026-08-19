type Schema = Record<string, unknown>;
type Props = { data: Schema | Schema[] };

/**
 * Structured data.
 *
 * An array renders as one `<script>` per schema rather than a single tag
 * holding a JSON array. Both are valid JSON-LD, but browser extensions and
 * SEO tools routinely do `JSON.parse(tag.textContent)["@context"]` on every
 * ld+json tag they find — on an array that yields undefined and their crash
 * surfaces in the page's console as if it were ours. Object-per-tag makes the
 * markup immune to that whole class of consumer, at zero cost.
 *
 * `<` is escaped so no value can terminate the script tag early.
 */
export function JsonLd({ data }: Props) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script
          key={typeof item["@type"] === "string" ? `${item["@type"]}-${index}` : index}
          type="application/ld+json"
          // The payload is built from our own typed data, never user input.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

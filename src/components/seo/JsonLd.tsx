type Props = { data: Record<string, unknown> | Record<string, unknown>[] };

/**
 * Structured data. Serialised with `<` escaped so a value can never terminate
 * the script tag early.
 */
export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own typed data, never user input.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

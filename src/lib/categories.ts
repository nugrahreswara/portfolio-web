// The Certification table feeds two different public sections: Certifications
// (`category === "certification"`) and Training. The split used to be a literal
// string compare, so a row saved with a blank or odd-cased category silently
// fell into Training (that is how "AWS Certified Cloud Practitioner" ended up
// under Training). Every reader now goes through `normalizeCategory`, and the
// only values that can ever reach the database are the two below.

export const CERT_CATEGORIES = ["certification", "training"] as const;
export type CertCategory = (typeof CERT_CATEGORIES)[number];

/** Blank, unknown or oddly-cased input collapses to a *certification*. */
export function normalizeCategory(value: unknown): CertCategory {
  return String(value ?? "").trim().toLowerCase() === "training" ? "training" : "certification";
}

export function isCertification(value: unknown): boolean {
  return normalizeCategory(value) === "certification";
}

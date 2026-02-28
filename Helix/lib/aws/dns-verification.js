import dns from "dns/promises";

/**
 * Verify DNS TXT record for domain ownership verification.
 * 
 * @param {string} domain - Domain to verify
 * @param {string} expectedValue - Expected TXT record value
 * @returns {Promise<boolean>} True if verified
 */
export async function verifyDomainOwnership(domain, expectedValue) {
  console.log(`[DNS] Verifying ownership for: ${domain}`);
  console.log(`[DNS] Expected value: ${expectedValue}`);

  try {
    // Check TXT record at _sitepilot-verify.domain.com
    const verificationHost = `_sitepilot-verify.${domain}`;

    console.log(`[DNS] Querying TXT records for: ${verificationHost}`);

    const records = await dns.resolveTxt(verificationHost);

    console.log(`[DNS] Found ${records.length} TXT record(s):`, records);

    // TXT records are returned as arrays of strings (for multi-part records)
    // We need to flatten and check each one
    for (const record of records) {
      const value = Array.isArray(record) ? record.join("") : record;

      console.log(`[DNS] Checking record: ${value}`);

      if (value === expectedValue) {
        console.log(`[DNS] ✓ Ownership verified!`);
        return true;
      }
    }

    console.log(`[DNS] ✗ No matching TXT record found`);
    return false;

  } catch (error) {
    console.error("[DNS] Verification failed:", error.message);

    // ENOTFOUND means no records exist
    if (error.code === "ENOTFOUND") {
      console.log("[DNS] No TXT records found for verification host");
    }

    return false;
  }
}

/**
 * Verify CNAME record points to CloudFront distribution.
 * 
 * @param {string} domain - Custom domain
 * @param {string} expectedTarget - Expected CNAME target (CloudFront endpoint)
 * @returns {Promise<boolean>} True if CNAME is correctly configured
 */
export async function verifyCNAME(domain, expectedTarget) {
  console.log(`[DNS] Verifying CNAME for: ${domain}`);
  console.log(`[DNS] Expected target: ${expectedTarget}`);

  try {
    const records = await dns.resolveCname(domain);

    console.log(`[DNS] Found CNAME record(s):`, records);

    // Normalize both values (remove trailing dots, lowercase)
    const normalizedTarget = expectedTarget.toLowerCase().replace(/\.$/, "");

    for (const record of records) {
      const normalizedRecord = record.toLowerCase().replace(/\.$/, "");

      if (normalizedRecord === normalizedTarget) {
        console.log(`[DNS] ✓ CNAME verified!`);
        return true;
      }
    }

    console.log(`[DNS] ✗ CNAME does not match expected target`);
    return false;

  } catch (error) {
    console.error("[DNS] CNAME verification failed:", error.message);

    if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
      console.log("[DNS] No CNAME record found");
    }

    return false;
  }
}

/**
 * Check if a domain resolves at all (A or CNAME record exists).
 * 
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} True if domain resolves
 */
export async function domainResolves(domain) {
  console.log(`[DNS] Checking if domain resolves: ${domain}`);

  try {
    // Try A record first
    try {
      const addresses = await dns.resolve4(domain);
      console.log(`[DNS] Domain resolves to A records:`, addresses);
      return true;
    } catch (aError) {
      // Try AAAA record
      try {
        const addresses = await dns.resolve6(domain);
        console.log(`[DNS] Domain resolves to AAAA records:`, addresses);
        return true;
      } catch (aaaaError) {
        // Try CNAME record
        try {
          const cnames = await dns.resolveCname(domain);
          console.log(`[DNS] Domain has CNAME records:`, cnames);
          return true;
        } catch (cnameError) {
          console.log(`[DNS] Domain does not resolve`);
          return false;
        }
      }
    }
  } catch (error) {
    console.error("[DNS] Failed to check domain resolution:", error);
    return false;
  }
}

/**
 * Generate a verification token for domain ownership.
 * 
 * @param {string} domain - Domain to generate token for
 * @returns {string} Verification value to be placed in TXT record
 */
export function generateVerificationToken(domain) {
  const crypto = require("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(`sitepilot-verification-${domain}-${Date.now()}`)
    .digest("hex");

  return `sitepilot-verification=${hash.substring(0, 32)}`;
}

/**
 * Validate domain format.
 * 
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if domain format is valid
 */
export function isValidDomain(domain) {
  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

  if (!domainRegex.test(domain)) {
    return false;
  }

  // Additional checks
  if (domain.length > 253) {
    return false;
  }

  // Check each label length
  const labels = domain.split(".");
  for (const label of labels) {
    if (label.length > 63 || label.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Extract root domain from subdomain.
 * Example: www.example.com -> example.com
 * 
 * @param {string} domain - Full domain
 * @returns {string} Root domain
 */
export function getRootDomain(domain) {
  const parts = domain.split(".");

  // Handle special cases like .co.uk
  if (parts.length >= 3 && ["co", "org", "gov", "ac"].includes(parts[parts.length - 2])) {
    return parts.slice(-3).join(".");
  }

  // Standard case: last two parts
  return parts.slice(-2).join(".");
}

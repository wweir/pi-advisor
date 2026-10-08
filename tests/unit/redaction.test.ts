import { describe, expect, it } from "vitest";

import { boundedFindingLabel, redactSecrets } from "../../src/index.js";

const KEY_MATERIAL = "MIIEowIBAAKCAQEAxQ4m0Xk2nQ0v".repeat(6);

describe("redactSecrets", () => {
	it("keeps the @ separator when redacting URL credentials", () => {
		const result = redactSecrets("connect https://alice:s3cr3tpw@example.com/path now");
		expect(result.text).toBe("connect https://alice:[REDACTED]@example.com/path now");
	});

	it("redacts an unterminated private key block through the end of input", () => {
		const result = redactSecrets(`-----BEGIN RSA PRIVATE KEY-----\n${KEY_MATERIAL}`);
		expect(result.text).not.toContain("MIIEow");
		expect(result.text).toBe("[REDACTED]");
	});

	it("leaves a terminated private key block redacting only the block", () => {
		const result = redactSecrets(
			`before -----BEGIN RSA PRIVATE KEY-----\n${KEY_MATERIAL}\n-----END RSA PRIVATE KEY----- after`,
		);
		expect(result.text).toBe("before [REDACTED] after");
	});
});

describe("boundedFindingLabel", () => {
	it("never keeps key material from a block severed by the label bound", () => {
		const label = boundedFindingLabel(`-----BEGIN RSA PRIVATE KEY-----\n${KEY_MATERIAL}`);
		expect(label).toBe("[REDACTED]");
	});
});

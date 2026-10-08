import { homedir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ProtectedPathPolicy } from "../../src/index.js";

const noExtraProtection = { additionalProtectedPaths: [], protectedPathExceptions: [] };

describe("ProtectedPathPolicy tool-path normalization", () => {
	it("blocks protected home paths reached through ~, @, and file:// aliases", async () => {
		const policy = new ProtectedPathPolicy("/tmp/advisor-cwd", noExtraProtection);
		const credentials = join(homedir(), ".config", "gcloud", "credentials.db");
		expect(await policy.allows(credentials)).toBe(false);
		expect(await policy.allows("~/.config/gcloud/credentials.db")).toBe(false);
		expect(await policy.allows("@~/.config/gcloud/credentials.db")).toBe(false);
		expect(await policy.allows(`file://${credentials}`)).toBe(false);
	});

	it("expands ~ in additionalProtectedPaths against the home directory", async () => {
		const policy = new ProtectedPathPolicy("/tmp/advisor-cwd", {
			additionalProtectedPaths: ["~/advisor-secrets"],
			protectedPathExceptions: [],
		});
		expect(await policy.allows(join(homedir(), "advisor-secrets", "token.txt"))).toBe(false);
		expect(await policy.allows("~/advisor-secrets/token.txt")).toBe(false);
	});

	it("still allows an ordinary cwd-relative path", async () => {
		const policy = new ProtectedPathPolicy("/tmp/advisor-cwd", noExtraProtection);
		expect(await policy.allows("src/index.ts")).toBe(true);
		expect(await policy.allows("/tmp/advisor-cwd/src/index.ts")).toBe(true);
	});
});

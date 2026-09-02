import { afterEach, describe, expect, it } from "vitest";

import {
	HISTORY_COMPRESSION_FLAG,
	NO_REASONING_FLAG,
	isHistoryCompressionEnabled,
	isNoReasoningRenderEnabled,
} from "../../src/feature-flags.js";

describe("advisor context feature flags (default on, `0` opts out)", () => {
	afterEach(() => {
		process.env[NO_REASONING_FLAG] = "";
		process.env[HISTORY_COMPRESSION_FLAG] = "";
	});

	it("no-reasoning rendering is on unless explicitly disabled with =0", () => {
		expect(isNoReasoningRenderEnabled()).toBe(true);
		process.env[NO_REASONING_FLAG] = "";
		expect(isNoReasoningRenderEnabled()).toBe(true);
		process.env[NO_REASONING_FLAG] = "1";
		expect(isNoReasoningRenderEnabled()).toBe(true);
		process.env[NO_REASONING_FLAG] = "0";
		expect(isNoReasoningRenderEnabled()).toBe(false);
	});

	it("history compression is on unless explicitly disabled with =0", () => {
		expect(isHistoryCompressionEnabled()).toBe(true);
		process.env[HISTORY_COMPRESSION_FLAG] = "";
		expect(isHistoryCompressionEnabled()).toBe(true);
		process.env[HISTORY_COMPRESSION_FLAG] = "0";
		expect(isHistoryCompressionEnabled()).toBe(false);
	});
});

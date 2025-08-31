/// <reference types="../src/vite-env.d.ts" />

import { describe, expect, test } from "vitest";
import { compareStructures } from "./utils/compareStructures";

interface CommonMarkTest {
  markdown: string;
  html: string;
  example: number;
  start_line: number;
  end_line: number;
  section: string;
}

// Test all CommonMark fixtures
describe("CommonMark Grammar Tests", () => {
  // Auto-discover and load fixture JSON files directly as objects
  const modules = import.meta.glob("./fixtures/*.json", {
    import: "default",
    eager: true,
  }) as Record<string, CommonMarkTest[]>;

  // Test each fixture file
  Object.entries(modules).forEach(([path, tests]) => {
    const fixture = path.replace("./fixtures/", "");
    const sectionName = fixture.replace(".json", "").replace(/-/g, " ");

    describe(sectionName, () => {
      test(`should match mdast structure for all ${tests.length} test cases`, () => {
        let passedCount = 0;
        let failedCount = 0;
        const failures: string[] = [];

        tests.forEach((testCase) => {
          const result = compareStructures(testCase.markdown);

          if (result.matches) {
            passedCount++;
          } else {
            failedCount++;
            failures.push(
              `Example ${testCase.example}: ${result.differences.join("; ")}`,
            );
          }
        });

        console.log(`\n${sectionName}: ${passedCount}/${tests.length} passed`);

        if (failedCount > 0) {
          console.log(`Failures:\n${failures.slice(0, 5).join("\n")}`);
          if (failures.length > 5) {
            console.log(`... and ${failures.length - 5} more failures`);
          }
        }

        expect(passedCount).toBe(tests.length);
      });
    });
  });

  // Summary test using preloaded data
  test("should provide overall test summary", () => {
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(modules).forEach(([, tests]) => {
      tests.forEach((testCase) => {
        if (testCase && typeof testCase.markdown === "string") {
          totalTests++;
          const result = compareStructures(testCase.markdown);
          if (result.matches) {
            totalPassed++;
          } else {
            totalFailed++;
          }
        }
      });
    });

    const passRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0";

    console.log(`\n📊 CommonMark Grammar Test Summary:`);
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Pass rate: ${passRate}%`);
  });
});

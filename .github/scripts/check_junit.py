"""Fail a CI tier when its JUnit reports are missing or contain no executed tests."""

import glob
import sys
import xml.etree.ElementTree as ET


def main(patterns: list[str]) -> int:
    critical = "--critical-integration" in patterns
    patterns = [pattern for pattern in patterns if pattern != "--critical-integration"]
    if not patterns:
        print("Provide one or more required JUnit report patterns.", file=sys.stderr)
        return 1
    failed = False
    for pattern in patterns:
        paths = sorted(glob.glob(pattern))
        if not paths:
            print(f"FAIL: no reports match {pattern}", file=sys.stderr)
            failed = True
            continue
        passed = skipped = failures = 0
        try:
            for path in paths:
                root = ET.parse(path).getroot()
                cases = list(root.iter("testcase"))
                file_skipped = 0
                for case in cases:
                    if case.find("failure") is not None or case.find("error") is not None:
                        failures += 1
                    elif case.find("skipped") is not None:
                        file_skipped += 1
                    else:
                        passed += 1
                # Mocha JUnit records pending cases in the root's skipped count
                # without emitting individual testcase elements.
                reported_skipped = int(root.get("skipped", "0"))
                skipped += max(file_skipped, reported_skipped)
                represented = len(cases) + max(0, reported_skipped - file_skipped)
                if root.get("tests") is not None and int(root.get("tests")) != represented:
                    print(f"FAIL: incomplete report for {pattern}", file=sys.stderr)
                    failed = True
        except (OSError, ET.ParseError, ValueError) as error:
            print(f"FAIL: invalid report for {pattern}: {error}", file=sys.stderr)
            failed = True
            continue
        print(f"{pattern}: {passed} passed, {failures} failed, {skipped} skipped")
        if failures or passed + failures == 0:
            failed = True
    if critical:
        # Baseline from develop at TCG-763: review deliberate suite changes with QA.
        minimums = {"auth.spec.tsx": 1, "cart.spec.tsx": 7, "payment.spec.tsx": 4}
        try:
            cases = list(ET.parse("test-results/integration.xml").getroot().iter("testcase"))
            for suffix, minimum in minimums.items():
                selected = [case for case in cases if case.get("classname", "").endswith("/" + suffix)]
                if len(selected) < minimum or any(case.find("skipped") is not None for case in selected):
                    print(f"FAIL: critical {suffix} has fewer than {minimum} cases or contains skips", file=sys.stderr)
                    failed = True
        except (OSError, ET.ParseError) as error:
            print(f"FAIL: critical integration report unavailable: {error}", file=sys.stderr)
            failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

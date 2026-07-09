package utils

import (
	"regexp"
	"testing"
)

func TestGenerateShortCode(t *testing.T) {
	t.Run("returns requested length", func(t *testing.T) {
		lengths := []int{1, 6, 12, 32}

		for _, length := range lengths {
			code, err := GenerateShortCode(length)
			if err != nil {
				t.Fatalf("GenerateShortCode(%d) returned error: %v", length, err)
			}

			if len(code) != length {
				t.Fatalf("GenerateShortCode(%d) returned length %d, want %d", length, len(code), length)
			}
		}
	})

	t.Run("successive calls generate different strings", func(t *testing.T) {
		const (
			length    = 24
			iterations = 10
		)

		seen := make(map[string]struct{}, iterations)

		for range iterations {
			code, err := GenerateShortCode(length)
			if err != nil {
				t.Fatalf("GenerateShortCode(%d) returned error: %v", length, err)
			}

			if _, exists := seen[code]; exists {
				t.Fatalf("GenerateShortCode(%d) produced duplicate value on successive calls: %q", length, code)
			}

			seen[code] = struct{}{}
		}
	})

	t.Run("contains only alphanumeric characters", func(t *testing.T) {
		const length = 64

		code, err := GenerateShortCode(length)
		if err != nil {
			t.Fatalf("GenerateShortCode(%d) returned error: %v", length, err)
		}

		alphanumericPattern := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
		if !alphanumericPattern.MatchString(code) {
			t.Fatalf("GenerateShortCode(%d) returned non-alphanumeric code: %q", length, code)
		}
	})
}

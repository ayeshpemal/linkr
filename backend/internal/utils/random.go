package utils

import (
	"crypto/rand"
	"fmt"
)

const shortCodeAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateShortCode(length int) (string, error) {
	if length <= 0 {
		return "", nil
	}

	// Allocate all required random bytes at once
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to read random bytes: %w", err)
	}

	code := make([]byte, length)
	alphabetLen := byte(len(shortCodeAlphabet))

	for i, b := range bytes {
		// Use modulo to map the random byte to our alphabet range
		code[i] = shortCodeAlphabet[b%alphabetLen]
	}

	return string(code), nil
}

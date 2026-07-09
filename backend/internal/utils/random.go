package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

const shortCodeAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


func GenerateShortCode(length int) (string, error) {
	if length <= 0 {
		return "", nil 
	}

	code := make([]byte, length)
	maxIndex := big.NewInt(int64(len(shortCodeAlphabet)))

	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, maxIndex)
		if err != nil {
			return "", fmt.Errorf("failed to generate random number: %w", err)
		}
		
		code[i] = shortCodeAlphabet[n.Int64()]
	}

	return string(code), nil
}

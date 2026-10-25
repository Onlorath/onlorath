// Package slug builds URL-safe identifiers from (Turkish) titles.
package slug

import (
	"regexp"
	"strings"
)

var (
	turkish   = strings.NewReplacer("ç", "c", "ğ", "g", "ı", "i", "ö", "o", "ş", "s", "ü", "u", "â", "a", "î", "i", "û", "u")
	nonAlnum  = regexp.MustCompile(`[^a-z0-9]+`)
	turkishUp = strings.NewReplacer("İ", "i", "I", "ı")
)

// Make lowercases title, transliterates Turkish letters and joins words with hyphens.
func Make(title string) string {
	s := strings.ToLower(turkishUp.Replace(title))
	s = turkish.Replace(s)
	s = strings.Trim(nonAlnum.ReplaceAllString(s, "-"), "-")
	if s == "" {
		return "untitled"
	}
	return s
}

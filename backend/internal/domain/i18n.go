package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// Supported content locales. The first one is the fallback.
const (
	LocaleTR = "tr"
	LocaleEN = "en"
)

// NormalizeLocale maps any input to a supported locale, defaulting to Turkish.
func NormalizeLocale(locale string) string {
	if strings.HasPrefix(strings.ToLower(locale), LocaleEN) {
		return LocaleEN
	}
	return LocaleTR
}

// LocalizedText is a bilingual string stored as a JSONB object {"tr": "...", "en": "..."}.
type LocalizedText struct {
	TR string `json:"tr"`
	EN string `json:"en"`
}

// Pick returns the text for locale, falling back to the other language when empty.
func (t LocalizedText) Pick(locale string) string {
	if NormalizeLocale(locale) == LocaleEN {
		if t.EN != "" {
			return t.EN
		}
		return t.TR
	}
	if t.TR != "" {
		return t.TR
	}
	return t.EN
}

// IsEmpty reports whether neither language has content.
func (t LocalizedText) IsEmpty() bool {
	return strings.TrimSpace(t.TR) == "" && strings.TrimSpace(t.EN) == ""
}

func (t LocalizedText) Value() (driver.Value, error) { return jsonValue(t) }
func (t *LocalizedText) Scan(src any) error          { return jsonScan(src, t) }

// LocalizedList is an ordered list of bilingual strings (e.g. about paragraphs).
type LocalizedList []LocalizedText

func (l LocalizedList) Value() (driver.Value, error) {
	if l == nil {
		l = LocalizedList{}
	}
	return jsonValue(l)
}
func (l *LocalizedList) Scan(src any) error { return jsonScan(src, l) }

// jsonValue serializes v for a JSONB column.
func jsonValue(v any) (driver.Value, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// jsonScan decodes a JSONB column into dst.
func jsonScan(src any, dst any) error {
	var b []byte
	switch v := src.(type) {
	case nil:
		return nil
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("unsupported JSONB source type %T", src)
	}
	if len(b) == 0 {
		return nil
	}
	return json.Unmarshal(b, dst)
}

// Shared validation helpers for content types.

var allowedColors = map[string]bool{"coral": true, "sky": true, "butter": true, "lavender": true, "sage": true}

func validateColor(color string) error {
	if !allowedColors[color] {
		return &ValidationError{Field: "color", Message: "color must be one of coral, sky, butter, lavender, sage"}
	}
	return nil
}

var errEmptyIDs = errors.New("ids must not be empty")

// ReorderRequest sets sort_order to each id's position in IDs.
type ReorderRequest struct {
	IDs []string `json:"ids"`
}

func (r *ReorderRequest) Validate() error {
	if len(r.IDs) == 0 {
		return &ValidationError{Field: "ids", Message: errEmptyIDs.Error()}
	}
	return nil
}

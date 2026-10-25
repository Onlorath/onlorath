package domain

import "testing"

func TestLocalizedTextPick(t *testing.T) {
	both := LocalizedText{TR: "merhaba", EN: "hello"}
	trOnly := LocalizedText{TR: "merhaba"}
	enOnly := LocalizedText{EN: "hello"}

	cases := []struct {
		name   string
		text   LocalizedText
		locale string
		want   string
	}{
		{"tr", both, "tr", "merhaba"},
		{"en", both, "en", "hello"},
		{"en-US prefix", both, "en-US", "hello"},
		{"unknown falls back to tr", both, "de", "merhaba"},
		{"en falls back to tr", trOnly, "en", "merhaba"},
		{"tr falls back to en", enOnly, "tr", "hello"},
	}
	for _, c := range cases {
		if got := c.text.Pick(c.locale); got != c.want {
			t.Errorf("%s: Pick(%q) = %q, want %q", c.name, c.locale, got, c.want)
		}
	}
}

func TestLocalizedTextScanValueRoundTrip(t *testing.T) {
	in := LocalizedText{TR: "çğıöşü", EN: "plain"}
	v, err := in.Value()
	if err != nil {
		t.Fatal(err)
	}

	var out LocalizedText
	if err := out.Scan([]byte(v.(string))); err != nil {
		t.Fatal(err)
	}
	if out != in {
		t.Fatalf("round trip = %+v, want %+v", out, in)
	}

	var fromNil LocalizedText
	if err := fromNil.Scan(nil); err != nil || !fromNil.IsEmpty() {
		t.Fatalf("Scan(nil) = %+v, %v", fromNil, err)
	}
}

func TestLocalizedListNilValue(t *testing.T) {
	var l LocalizedList
	v, err := l.Value()
	if err != nil || v != "[]" {
		t.Fatalf("nil list Value() = %v, %v; want []", v, err)
	}
}

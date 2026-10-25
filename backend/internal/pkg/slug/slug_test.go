package slug

import "testing"

func TestMake(t *testing.T) {
	cases := map[string]string{
		"Balon Patlatma":        "balon-patlatma",
		"Taksit & Bütçe":        "taksit-butce",
		"İstanbul'da Işık Çağı": "istanbul-da-isik-cagi",
		"  --  ":                "untitled",
		"CV Maker AI":           "cv-maker-ai",
	}
	for in, want := range cases {
		if got := Make(in); got != want {
			t.Errorf("Make(%q) = %q, want %q", in, got, want)
		}
	}
}

package migrate

import (
	"reflect"
	"testing"
	"testing/fstest"
)

func TestPendingSortsAndSkipsApplied(t *testing.T) {
	fsys := fstest.MapFS{
		"0002_b.sql": {Data: []byte("SELECT 2")},
		"0001_a.sql": {Data: []byte("SELECT 1")},
		"0010_c.sql": {Data: []byte("SELECT 10")},
		"embed.go":   {Data: []byte("package migrations")},
	}

	got, err := Pending(fsys, nil)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"0001_a.sql", "0002_b.sql", "0010_c.sql"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("Pending() = %v, want %v", got, want)
	}

	got, err = Pending(fsys, []string{"0001_a.sql", "0002_b.sql"})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, []string{"0010_c.sql"}) {
		t.Fatalf("Pending() with applied = %v", got)
	}
}

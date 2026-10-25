// Package migrations embeds the ordered SQL schema files applied at API startup.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS

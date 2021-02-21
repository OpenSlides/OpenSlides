package main

// reading_client simulates clients, that login to openslides and after a
// successfull login send all request, that the client usual sends.
import (
	"os"

	"github.com/OpenSlides/OpenSlides/performance/os-performace/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}

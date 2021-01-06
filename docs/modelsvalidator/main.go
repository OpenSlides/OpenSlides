package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/OpenSlides/Openslides/modelsvalidator/check"
	models "github.com/OpenSlides/openslides-models-to-go"
)

func main() {
	var content io.Reader = os.Stdin
	if len(os.Args) > 1 {
		c, err := openModels(os.Args[1])
		if err != nil {
			log.Fatalf("Can not load content: %v", err)
		}
		defer c.Close()
		content = c
	}

	data, err := models.Unmarshal(content)
	if err != nil {
		log.Fatalf("Invalid model format: %v", err)
	}

	if err := check.Check(data); err != nil {
		log.Fatalf("Invalid model structure:\n\n%v", err)
	}
}

// openModels reads the model either from file or from an url.
func openModels(path string) (io.ReadCloser, error) {
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return openModelsFromURL(path)
	}

	return os.Open(path)
}

func openModelsFromURL(url string) (io.ReadCloser, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("requesting models from url: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("can not get models from url. Got status %s", resp.Status)
	}

	return resp.Body, nil
}

package check_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/OpenSlides/Openslides/modelsvalidator/check"
	models "github.com/OpenSlides/openslides-models-to-go"
)

const yamlUnknownFieldType = `---
some_model:
  field: unknown
`

const yamlNonExistingModel = `---
some_model:
  no_other_model:
    type: relation
    to: not_existing/field
`

const yamlNonExistingField = `---
some_model:
  no_other_field:
    type: relation
    to: other_model/bar
other_model:
  foo: string
`

const yamlDuplicateTemplatePrefix = `---
some_model:
  field_$_1: number
  field_$_2: number
`

const yamlWrongReverseRelaitonType = `---
some_model:
  other_model:
    type: relation
    to: other_model/field
other_model:
  field: HTMLStrict
`

func TestCheck(t *testing.T) {
	for _, tt := range []struct {
		name string
		yaml string
		err  string
	}{
		{
			"unknown type",
			yamlUnknownFieldType,
			"Unknown type `unknown` in some_model/field",
		},
		{
			"non-existing model",
			yamlNonExistingModel,
			"some_model/no_other_model directs to nonexisting model `not_existing`",
		},
		{
			"non-existing Field",
			yamlNonExistingField,
			"some_model/no_other_field directs to nonexisting collectionfield `other_model/bar`",
		},
		{
			"duplicate template prefix",
			yamlDuplicateTemplatePrefix,
			"Duplicate template prefix field_ in some_model",
		},
		{
			"wrong reverse relation type",
			yamlWrongReverseRelaitonType,
			"some_model/other_model directs to `other_model/field`, but it is not a relation, but HTMLStrict",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			data, err := models.Unmarshal(strings.NewReader(tt.yaml))
			if err != nil {
				t.Fatalf("Can not unmarshal yaml: %v", err)
			}
			gotErr := check.Check(data)
			if tt.err == "" {
				if gotErr != nil {
					t.Errorf("Models.Check() returned an unexepcted error: %v", err)
				}
				return
			}

			if gotErr == nil {
				t.Fatalf("Models.Check() did not return an error, expected: %v", tt.err)
			}

			var errList *check.ErrorList
			if !errors.As(gotErr, &errList) {
				t.Fatalf("Models.Check() did not return a ListError, got: %v", gotErr)
			}

			var found bool
			for _, err := range errList.Errs {
				var errList *check.ErrorList
				if !errors.As(err, &errList) {
					continue
				}

				for _, err := range errList.Errs {
					if err.Error() == tt.err {
						found = true
					}
				}
			}

			if !found {
				t.Errorf("Models.Check() returned:\n%v\n\nExpected something that contains:\n%v", gotErr, tt.err)
			}
		})
	}
}

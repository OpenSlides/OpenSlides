package check

import (
	"fmt"
	"strings"

	models "github.com/OpenSlides/openslides-models-to-go"
)

// Check runs some checks on the given models.
func Check(data map[string]models.Model) error {
	validators := []func(map[string]models.Model) error{
		validateTypes,
		validateRelations,
		validateTemplatePrefixes,
	}

	errors := new(ErrorList)
	for _, v := range validators {
		if err := v(data); err != nil {
			errors.append(err)
		}
	}

	if !errors.empty() {
		return errors
	}
	return nil
}

func validateTypes(data map[string]models.Model) error {
	scalar := scalarTypes()
	relation := relationTypes()
	errs := &ErrorList{
		Name:   "type validator",
		intent: 1,
	}
	for modelName, model := range data {
		for fieldName, field := range model.Fields {
			if scalar[strings.TrimSuffix(field.Type, "[]")] {
				continue
			}

			if relation[field.Type] {
				continue
			}

			errs.append(fmt.Errorf("Unknown type `%s` in %s/%s", field.Type, modelName, fieldName))
		}
	}
	if errs.empty() {
		return nil
	}
	return errs
}

func validateRelations(data map[string]models.Model) error {
	errs := &ErrorList{
		Name:   "relation validator",
		intent: 1,
	}
	relation := relationTypes()
	for modelName, model := range data {
	Next:
		for fieldName, field := range model.Fields {
			r := field.Relation()
			if r == nil {
				continue
			}

			for _, c := range r.ToCollections() {
				toModel, ok := data[c.Collection]
				if !ok {
					errs.append(fmt.Errorf("%s/%s directs to nonexisting model `%s`", modelName, fieldName, c.Collection))
					continue Next
				}

				toField, ok := toModel.Fields[c.ToField.Name]
				if !ok {
					errs.append(fmt.Errorf("%s/%s directs to nonexisting collectionfield `%s/%s`", modelName, fieldName, c.Collection, c.ToField.Name))
					continue Next
				}

				if !relation[toField.Type] {
					errs.append(fmt.Errorf("%s/%s directs to `%s/%s`, but it is not a relation, but %s", modelName, fieldName, c.Collection, c.ToField.Name, toField.Type))
					continue Next
				}

			}
		}
	}
	if errs.empty() {
		return nil
	}
	return errs
}

func validateTemplatePrefixes(models map[string]models.Model) error {
	errs := &ErrorList{
		Name:   "template prefixes validator",
		intent: 1,
	}
	for modelName, model := range models {
		prefixes := map[string]bool{}
		for fieldName := range model.Fields {
			i := strings.Index(fieldName, "$")
			if i < 0 {
				continue
			}
			prefix := fieldName[0:i]
			if prefixes[prefix] {
				errs.append(fmt.Errorf("Duplicate template prefix %s in %s", prefix, modelName))
			}
			prefixes[prefix] = true
		}
	}
	if errs.empty() {
		return nil
	}
	return errs
}

// scalarTypes are the main types. All scalarTypes can be used as a list.
// JSON[], timestamp[] etc.
func scalarTypes() map[string]bool {
	s := []string{
		"string",
		"number",
		"boolean",
		"JSON",
		"HTMLPermissive",
		"HTMLStrict",
		"float",
		"decimal(6)",
		"timestamp",
	}
	out := make(map[string]bool)
	for _, t := range s {
		out[t] = true
	}
	return out
}

// relationTypes are realtion types in realtion to other fields.
func relationTypes() map[string]bool {
	s := []string{
		"relation",
		"relation-list",
		"generic-relation",
		"generic-relation-list",
		"template",
	}
	out := make(map[string]bool)
	for _, t := range s {
		out[t] = true
	}
	return out
}

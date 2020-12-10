# Modelsvalidator

Modelsvalidator is a tool to validate the models.yml file


## Run

Build first: `go build ./...`.

The tool requires the content of the models.yml. It can be provided via stdin, a
file system path or an url starting with http:// or https://.


```
cat models.yml | modelsvalidator
modelsvalidator openslides/docs/models.yml
modelsvalidator https://raw.githubusercontent.com/OpenSlides/OpenSlides/openslides4-dev/docs/models.yml
```

The tool returns with status code 0 and no content, if the given content is
valid. It returns with a positive status code and some error messages if not.

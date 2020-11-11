# Modelsvalidate

Modelsvalidate is a tool to validate the models.yml file, that is used in the
development process of OpenSlides 4.


## Run

The tool requires the content of the models.yml. It can be provided via stdin, a
file system path or an url starting with http:// or https://.


```
cat models.yaml | modelstool
modelstool openslides/docs/models.yml
modelstool https://raw.githubusercontent.com/OpenSlides/OpenSlides/openslides4-dev/docs/models.yml
```

The tool returns with status code 0 and no content, if the given content is
valid. It returns with a positive status code and some error messages if not.
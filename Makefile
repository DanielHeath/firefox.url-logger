all: xpi

xpi:
	zip -r url-logger.xpi install.rdf chrome.manifest defaults content locale skin

clean:
	rm url-logger.xpi

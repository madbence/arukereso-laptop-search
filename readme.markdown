# árukereső laptop szűrő

## usage

```sh
# node@7 needed (or transform it with babel)
$ npm i cheerio split
$ node --harmony_async_await index scrapeList > links.json
$ node --harmony_async_await index scrapeEntries > db.json
$ node --harmony_async_await index search < db.json
```

## license

MIT

const https = require('https');
const cheerio = require('cheerio');
const split = require('split');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.once('end', () => resolve(data));
      res.once('error', reject);
    });
  });
}

function filter(arr, name, fn) {
  return arr.find(prop => prop.name === name && fn(prop.value));
}

const methods = {

  scrapeList: async function scrapeList() {
    const entries = [];
    for (let i = 0; i < 4880; i += 25) {
      const res = await get(`https://www.arukereso.hu/notebook-c3100/?start=${i}`);
      const $ = cheerio.load(res);
      entries.push(...$('.name h2').map((index, el) => ({
        name: $(el).text().trim(),
        href: $(el).find('a').attr('href'),
      })).get());
      console.error(i);
    }
    console.log(JSON.stringify(entries));
  },

  scrapeEntries: async function scrapeEntries() {
    const entries = require('./links.json').sort((a, b) => a.name.localeCompare(b.name));
    let i = 0;
    for (const entry of entries) {
      const res = await get(entry.href);
      const $ = cheerio.load(res);
      const price = +$('.price').eq(0).text().trim().match(/(.*?)Ft/)[1].replace(/\D/g, '');
      const props = $('.prop-name').map((index, el) => ({
        name: $(el).text().trim(),
        value: $(el.parent).find('td').eq(1).text(),
      })).get();
      console.log(JSON.stringify({ entry, price, props }));
      console.error(`${++i}/${entries.length}`);
    }
  },

  search: async function search() {
    const results = [];
    return new Promise(resolve => {
      process.stdin.pipe(split()).on('data', line => {
        try {
          if (!line) return;
          const data = JSON.parse(line);
          const props = data.props;
          if (
            filter(props, 'Kijelző mérete', v => v === '13.3"') &&
            filter(props, 'Memória mérete', v => v === '8 GB') &&
            // filter(props, 'Memória típusa', v => v === 'DDR4') &&
            filter(props, 'Merevlemez típusa', v => v === 'SSD') &&
            filter(props, 'Merevlemez kapacitása', v => v.match(/128|256/)) &&
            filter(props, 'Kijelző felbontása', v => v === '1920 x 1080') &&
            filter(props, 'Processzor modell', v => v.match(/^(6|7)(2|3|4)/)) && // skylake & kaby lake i5
            filter(props, 'Videokártya modell', v => v.match(/Intel HD/))
          ) {
            results.push(data);
          }
        } catch (err) {
          console.error(err);
        }
      }).once('end', () => {
        for (const result of results.sort((a, b) => b.price - a.price)) {
          console.log(result.entry.name, result.price, result.entry.href);
        }
        resolve();
      });
    });
  },

};

methods[process.argv[2]]().then(
  () => console.error('done'),
  err => console.error(err.stack)
);

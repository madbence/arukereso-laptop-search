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
      const props = $('.prop-name').map((index, el) => ({
        name: $(el).text().trim(),
        value: $(el.parent).find('td').eq(1).text(),
      })).get();
      console.log(JSON.stringify({ entry, props }));
      console.error(`${++i}/${entries.length}`);
    }
    console.log(JSON.stringify(db));
  },
  search: async function search() {
    process.stdin.pipe(split()).on('data', line => {
      try {
        if (!line) return;
        const data = JSON.parse(line);
        if (data.props.find(prop => prop.name === 'Processzor modell' && prop.value.match(/^(6|7)(2|3)/)) &&
            data.props.find(prop => prop.name === 'Memória mérete' && prop.value.match(/8 ?GB/)) &&
            data.props.find(prop => prop.name === 'Kijelző mérete' && prop.value === '13.3"') &&
            data.props.find(prop => prop.name === 'Merevlemez típusa' && prop.value === 'SSD') &&
            data.props.find(prop => prop.name === 'Merevlemez kapacitása' && prop.value === '128 GB') &&
            data.props.find(prop => prop.name === 'Kijelző felbontása' && prop.value === '1920 x 1080')) {
          console.log(data.entry.name, data.entry.href);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
};

methods[process.argv[2]]().then(
  () => console.error('done'),
  err => console.error(err.stack)
);

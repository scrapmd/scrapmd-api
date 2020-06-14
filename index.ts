import * as Mercury from '@scrapmd/mercury-parser';
import * as TurndownService from 'turndown';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as URL from 'url';
import * as path from 'path';
import * as crypto from 'crypto';
import { JSDOM } from 'jsdom';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});
turndownService.use(require('turndown-plugin-gfm').gfm);
const port = parseInt(process.env.PORT || '8000');
const app = express();
app.use(bodyParser.json({ limit: '5mb' }));
const imgdir = 'img';
const checkAttribute = 'data-scrapmd-ok';

const responseResult = async (
  url: string,
  title: string,
  html: string | null,
  noTagCheck: boolean,
  res: express.Response,
) => {
  try {
    const result = await Mercury.parse(url, { html, fetchAllPages: false });
    result.title = title || result.title;
    const { content } = result;
    const dom = new JSDOM(content);
    const imageTags = dom.window.document.getElementsByTagName('img');
    const images: { [name: string]: string } = {};
    Array.from(imageTags).forEach(img => {
      const rawsrc = img.src.replace(/^\\\"(.+)\\\"$/, '$1');
      const ext = path.extname(rawsrc.replace(/\?.*$/, '')) || '.png';
      const fullsrc = URL.resolve(url, rawsrc);
      const md5 = crypto.createHash('md5');
      const sum = md5.update(rawsrc, 'utf8').digest('hex');
      const sumsrc = `${imgdir}/${sum}${ext}`;
      img.src = sumsrc;
      images[sumsrc] = fullsrc;
    });
    const anchorTags = dom.window.document.getElementsByTagName('a');
    Array.from(anchorTags).forEach(a => {
      a.href = URL.resolve(url, a.href.replace(/^\\\"(.+)\\\"$/, '$1'));
    });
    let markdown = turndownService.turndown(dom.window.document.body.innerHTML);
    if (result.title) {
      markdown = `# ${result.title}\n\n${markdown}`;
    }
    if (!noTagCheck && html.indexOf(checkAttribute) === -1 && content.indexOf(checkAttribute) === -1) {
      markdown = '';
    }
    res.json({ ...result, markdown, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
};

app.get('/', async (req, res) => {
  const { url, title, notagcheck } = req.query;
  console.info(`Start parsing ${url}`);
  await responseResult(url as string, title as string, null, notagcheck === '1', res);
});

app.post('/', async (req, res) => {
  const { url, html, title, notagcheck } = req.body;
  console.info(`Start parsing ${url} with prefetched HTML ${html}`);
  await responseResult(url, title, html, notagcheck === '1', res);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

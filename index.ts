import * as Mercury from "@postlight/mercury-parser";
import * as TurndownService from 'turndown'
const turndownService = new TurndownService();
const url = process.argv[2];
console.info(url);

Mercury.parse(url).then(result => {
  const content = result.content;
  const md = turndownService.turndown(content);
  const images = (content.match(/<img [^>]*src="([^"]+)"[^>]*>/ig) || []).map(img => img.match(/src="([^"]+)"/)[1]);
  console.info(images);

});

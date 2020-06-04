"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Mercury = require("@postlight/mercury-parser");
var TurndownService = require("turndown");
var turndownService = new TurndownService();
var url = process.argv[2];
console.info(url);
Mercury.parse(url).then(function (result) {
    var content = result.content;
    var md = turndownService.turndown(content);
    var images = (content.match(/<img [^>]*src="([^"]+)"[^>]*>/gi) || []).map(function (img) { return img.match(/src="([^"]+)"/)[1]; });
    console.info(images);
});

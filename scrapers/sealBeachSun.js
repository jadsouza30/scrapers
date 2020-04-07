const functions = require('firebase-functions');
require('es6-promise');
require('isomorphic-fetch');
const $ = require('cheerio');
const firebase = require('firebase-admin');
const helpers = require('./_helpers');
const uuid = require('uuid/v4');
const Article = require("./_article");

exports.Seal = async () => {
    const baseURL = "https://www.sunnews.org";
    let db = firebase.firestore();


    let list = await fetch(baseURL)
        .then((body) => {
            if (body.status < 200 || body.status >= 400) {
                throw new Error("Bad response from server");
            }
            return body.text();
        })
        .then((html) => {
            return parseHomepage(html);
        })
        .catch((err) => {
            console.log(err);
            return [];
        });

    list.forEach(async (l) => {
        await parseArticle(db, l);
    });
}

const parseHomepage = (text) => {
    var list = [];
    $('h3.entry-title.td-module-title', text).each((i, el) => {
        let url = $(el).find("a").attr("href");
        let title = $(el).find("a").text();
        if (url !== "javascript:void(0);") {
            list.push({ title, url });
        }
    });

    return list;
}

const parseArticle = async (db, link) => {
    if (!link.url) return;

    exist = await helpers.articleExists(db, link.url);
    if (exist) return;

    console.log("here");
    console.log("parsing:", link.url);

    let article = new Article();
    article.setURL(link.url)
    article.setTitle(link.title)

    fetch(article.url)
        .then((body) => {
            if (body.status < 200 || body.status >= 400) {
                throw new Error("Bad response from server");
            }
            return body.text();
        })
        // get content
        .then((html) => {
            var content = [];
            $("div.td-post-content p", html).each((i, el) => {
                content.push($(el).text());
            })
            article.setContent(content.join());

            const description = $("figcaption.wp-caption-text", html).text()

            article.setDescription("");

            return article;
        })
        // set tier -- do we even need tiers??
        .then((article) => {
            article.setTier(1);
            return article;
        })
        // set source
        .then((article) => {
            article.setSource('tmz');
            return article;
        })
        // save to database
        .then((article) => {
            //article.save(db);
            return article;
        })
        // debug display
        // .then((article) => console.log(article))
        .catch((err) => {
            console.log(err);
            return;
        });
}

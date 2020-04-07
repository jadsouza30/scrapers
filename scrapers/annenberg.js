const functions = require('firebase-functions');
require('es6-promise');
require('isomorphic-fetch');
const $ = require('cheerio');
const firebase = require('firebase-admin');
const helpers = require('./_helpers');
const uuid = require('uuid/v4');
const Article = require("./_article");

exports.ANN = async () => {
    const baseURL = "http://www.uscannenbergmedia.com";
    let db = firebase.firestore();


    let list = await fetch(baseURL)
        .then((body) => {
            if (body.status < 200 || body.status >= 400) {
              console.log("err");
                throw new Error("Bad response from server");
            }
            return body.text();
        })
        .then((html) => {
            return parseHomepage(html);
        })
        .catch((err) => {
            console.log("here");
            return [];
        });

    list.forEach(async (l) => {
        await parseArticle(db, l);
    });
}

const parseHomepage = (text) => {
    var list = [];
    console.log("here");
    $("article.result-item.result-teaser.result-teaser-normal header div.row div.col-sm-pull-4.col-sm-8 figure a", text).each((i, el) => {
        console.log("here");

        let title = $(el).find("h4").text();
        let url = $(el).attr("href");
        url="http://www.uscannenbergmedia.com"+url;

        console.log(title);
        console.log(url);
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
            $("p.element.element-paragraph", html).each((i, el) => {
                content.push($(el).text());
            })
            article.setContent(content.join());

            const description = $("span.caption.credit.col-sm-12.under-image ", html).text()
            article.setDescription(description);

            return article;
        })
        // set tier -- do we even need tiers??
        .then((article) => {
            article.setTier(1);
            return article;
        })
        // set source
        .then((article) => {
            article.setSource('annenberg');
            return article;
        })
        // save to database
        .then((article) => {
            article.save(db);
            return article;
        })
        // debug display
        // .then((article) => console.log(article))
        .catch((err) => {
            console.log(err);
            return;
        });
}

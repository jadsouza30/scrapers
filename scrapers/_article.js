const uuid = require('uuid/v4');
const helpers = require('./_helpers');

class Article {
    constructor() {
        this.id = uuid();
        this.created_at = Date.now();
        this.url = '';
        this.title = '';
        this.description = '';
        this.content = '';
        this.source = '';
        this.tier = 3;
        this.score = 0;
    }

    setURL(url) {
        this.url = url;
    }

    setTitle(title) {
        this.title = title;
    }

    setDescription(description) {
        this.description = description;
    }

    setContent(content) {
        this.content = content;
    }

    setSource(source) {
        this.source = source;
    }

    setTier(tier) {
        this.tier = tier;
    }

    async save(db) {
        await helpers.saveArticleToFirebase(db, this)
    }
}

module.exports = Article;
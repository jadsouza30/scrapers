require('es6-promise');
require('isomorphic-fetch');

exports.articleExists = async function (db, url) {
    let exists = await db.collection('articles')
        .where("url", "==", url)
        .get()
        .then((docSnapshot) => {
            if (!docSnapshot.empty) {
                return true;
            }
            return false;
        })
        .catch((e) => console.log(e));
    return exists
}

exports.runFakebox = async function (title, content, url) {
    let headers = new Headers();
    headers.set("Authorization", "Basic " + Buffer.from("overlooked:uscrocks2137").toString('base64'));
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    const res = await fetch("https://machinebox-dot-overlookedpage.appspot.com/fakebox/check", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            url: url,
            title: title,
            content: content.length > 3000 ? content.substring(0, 3000) : content,
        })
    })
        .then((response) => response.json())
        .catch((e) => console.log("Error running Fakebox:", e))
    return Math.floor(res.content.score * 100);
}

exports.saveArticleToFirebase = async (db, article) => {
    const id = article.id;
    var rest = Object.assign({}, article);
    delete rest.id;
    await db.collection('articles').doc(id).create(rest);
    return null;
}
const postTemplate = 
    `
    <div class="post">
        <div>
            [[[TitleTemplate]]]
            <p class="post-header normal-text">[[[PostName]]]</p>
            <a class="post-header" href="thread.html#[[[ParentPost]]]">[[[PostNumber]]]</a>
            <p class="post-header darker-text">[[[PostDate]]]</p>
            [[[ReplyButton]]]
        </div>
        <div class="post-body">
            [[[PostContent]]]
        </div>
    </div>
    `;

const replyButtonTemplate =
    `
    <span class="post-header normal-text">[<a href="thread.html#[[[ParentPost]]]">Reply</a>]</span>
    `;

const titleTemplate =
    `
    <strong class="post-header normal-text">[[[PostTitle]]]</strong>
    <span class="post-header normal-text"> - </span>
    `;

const baseUrl = "https://shitchan.herokuapp.com";
const authorHash = Math.random().toString(); // FIXME lol jk fix everything else first

function httpAsync(url, method, body, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if(xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200 || xmlHttp.status == 201) {
                callback(xmlHttp.responseText);
            } else {
                console.log("shit happened");
            }
        }
    };

    xmlHttp.open(method, url, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.send(body);
}

function getPageArgument() {
    return document.location.hash.substring(1);
}

function createPostContent(postData) {
    let lines = postData.content.replace(/\r\n/, "\n").split("\n");
    let final = "";
    const parentPost = postData.parentPostId ?? postData.id;

    for(let line of lines) {
        line = `<span class="normal-text"> ${line} </span>`;

        line = line
                .replace(/>>[0-9]*/, (matched) => `<a href="thread.html#${parentPost}" onclick="onQuote('${matched}')"> ${matched}</a>`)
                .replace(/>[^>|\s|\d].+/, (matched) => `<span class="quote-text"> ${matched} </span>`);
        
        final += `${line} <br />`;
    }

    return final;
}

function createPostElem(postData) {
    let postDate = new Date(postData.timestamp);
    const parentPost = postData.parentPostId ?? postData.id;
    const postDateValue = `${postDate.toISOString().split("T")[0]} ${postDate.getHours()}:${postDate.getMinutes()}`;

    let template = postTemplate
                    .replace("[[[ParentPost]]]", parentPost)
                    .replace("[[[PostName]]]", postData.author)
                    .replace("[[[PostNumber]]]", postData.id)
                    .replace("[[[PostDate]]]", postDateValue)
                    .replace("[[[PostContent]]]", createPostContent(postData));

    let finalTitle = "";

    if(postData.title) {
        finalTitle = titleTemplate.replace("[[[PostTitle]]]", postData.title);
    }

    let replyButton = postData.parentPostId ? "" : replyButtonTemplate.replace("[[[ParentPost]]]", parentPost);

    template = template
                .replace("[[[TitleTemplate]]]", finalTitle)
                .replace("[[[ReplyButton]]]", replyButton);

    let post = document.createElement("div");
    if(postData.parentPostId) {
        post.classList.add("post-reply");
    }
    post.innerHTML = template;

    return post;
}

function submitNewPost(board, parent) {
    let name = document.getElementById("reply-name").value;
    let title = document.getElementById("reply-title").value;
    let content = document.getElementById("reply-content").value;
    let postDate = new Date().getTime();

    let post =
    {
        "title": title,
        "author": name,
        "timestamp": postDate,
        "content": content,
        "authorHash": authorHash,
        "board": board,
        "parentPostId": parent
    };

    httpAsync(`${baseUrl}/api/threads`, "POST", JSON.stringify(post), function() {
        refreshThreads();
    });

    document.getElementById("reply-content").value = "";
}
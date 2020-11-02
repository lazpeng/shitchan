const postTemplate = 
    `
    <div class="post">
        <div>
            [[[StickyTemplate]]]
            [[[TitleTemplate]]]
            <p class="post-header normal-text">[[[PostName]]]</p>
            <a class="post-header" href="thread.html#[[[ParentPost]]]" onclick="onPostNumClicked([[[PostNumber]]])">[[[PostNumber]]]</a>
            <p class="post-header darker-text">[[[PostDate]]]</p>
            [[[ReplyButton]]]
            [[[ReportButton]]]
            [[[StickyButton]]]
            [[[DeleteButton]]]
        </div>
        <div class="post-body">
            [[[PostContent]]]
        </div>
        [[[ThreadOmittedPosts]]]
    </div>
    `;

const replyButtonTemplate =
    `
    <span class="post-header normal-text">[<a href="thread.html#[[[ParentPost]]]">Reply</a>]</span>
    `;
const postButtonTemplate =
    `
    <span class="post-header normal-text">[<a href="board.html#[[[Board]]]" onclick="[[[onclick]]]">[[[Text]]]</a>]</span>
    `;

const titleTemplate =
    `
    <strong class="post-header normal-text">[[[PostTitle]]]</strong>
    <span class="post-header normal-text"> - </span>
    `;
const stickyTemplate =
    `
    <strong class="post-header normal-text">[<span class="post-header sticky-title">Stickied</span> ]</strong>
    `;
const omittedPostsTemplate =
    `
    <strong class="post-header darker-text" style="padding-top: 15px">[[[NumPostsOmitted]]] post(s) omitted</strong>
    `;

//const baseUrl = "https://localhost:5001";
const baseUrl = "https://shitchan.herokuapp.com";

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

function getPostButton(text, action) {
    return postButtonTemplate
            .replaceAll("[[[Board]]]", getPageArgument())
            .replaceAll("[[[onclick]]]", action)
            .replaceAll("[[[Text]]]", text);
}

function sanitizeContent(content) {
    let div = document.createElement("div");
    div.textContent = content;
    return div.innerHTML;
}

function createPostContent(postData, postList) {
    let lines = postData.content.replace(/\r\n/, "\n").split("\n");
    let final = "";
    const parentPost = postData.parentPostId ?? postData.id;
    const authorHash = getCookie("session");

    for(let line of lines) {
        line = line
                .replaceAll(new RegExp(/>>[0-9]*/, 'g'), (matched) => {
                    let text = matched.substring(2);
                    let post = postList.filter(p => p.id == Number(text));
                    if(post && post.author == authorHash) {
                        text += " (You)";
                    } else if(text == parentPost) {
                        text += " (OP)";
                    }
                    return `<a href="thread.html#${parentPost}" onclick="onPostNumClicked(${matched})"> ${text} </a>`
                })
                .replaceAll(new RegExp(/^>([^>]|>>).+/, 'g'), (matched) => `<span class="quote-text"> ${matched} </span>`);
        
        final += `<span class="normal-text"> ${line} </span> <br />`;
    }

    return final;
}

function createPostElem(postData, onThread, thread) {
    let postDate = new Date(postData.posted);
    const parentPost = postData.parentPostId ?? postData.id;
    const postDateValue = `${postDate.toISOString().split("T")[0]} ${postDate.getHours()}:${postDate.getMinutes()}`;
    const deleteButton = isLoggedIn() ? getPostButton("Delete", `onDeletePost(${postData.id})`) : "";
    const stickyButton = isLoggedIn() && postData.parentPostId == null && !onThread ? getPostButton("Sticky thread", `onStickyPost(${postData.id}, ${postData.stickied ? "false" : "true"})`) : "";
    const replyButton = postData.parentPostId || onThread ? "" : replyButtonTemplate.replace("[[[ParentPost]]]", parentPost);
    const finalTitle = postData.title ? titleTemplate.replace("[[[PostTitle]]]", postData.title) : "";
    const finalSticky = postData.stickied && postData.parentPostId == null ? stickyTemplate : "";
    let omittedPosts = "";
    if(postData.parentPostId == null && thread.numberOfPosts > thread.children.length - 1 && !onThread) {
        let numOmitted = thread.numberOfPosts - thread.children.length + 1;
        omittedPosts = omittedPostsTemplate.replace("[[[NumPostsOmitted]]]", numOmitted);
    }

    let template = postTemplate
                    .replaceAll("[[[ParentPost]]]", parentPost)
                    .replaceAll("[[[PostName]]]", postData.author)
                    .replaceAll("[[[PostNumber]]]", postData.id)
                    .replaceAll("[[[PostDate]]]", postDateValue)
                    .replaceAll("[[[PostContent]]]", createPostContent(postData, thread.children))
                    .replaceAll("[[[ReportButton]]]", getPostButton("Report", `onReportPost(${postData.id})`))
                    .replaceAll("[[[StickyButton]]]", stickyButton)
                    .replaceAll("[[[DeleteButton]]]", deleteButton)
                    .replaceAll("[[[TitleTemplate]]]", finalTitle)
                    .replaceAll("[[[StickyTemplate]]]", finalSticky)
                    .replaceAll("[[[ReplyButton]]]", replyButton)
                    .replaceAll("[[[ThreadOmittedPosts]]]", omittedPosts);

    let post = document.createElement("div");
    if(postData.parentPostId) {
        post.classList.add("post-reply");
    }
    post.innerHTML = template;

    return post;
}

function onStickyPost(threadId, sticky) {
    let body = {
        postNumber: threadId,
        code: getCookie("code")
    };

    httpAsync(`${baseUrl}/api/threads/sticky?stickied=${sticky}`, "PUT", JSON.stringify(body), function() {
        if(pageLoad) {
            pageLoad();
        }
    });
}

function submitNewPost(board, parent, refreshCallback) {
    let name = document.getElementById("reply-name").value;
    let title = document.getElementById("reply-title").value;
    let content = document.getElementById("reply-content").value;
    let postDate = new Date().getTime();
    let authorHash = getCookie("session");

    let post =
    {
        "title": title,
        "author": name,
        "posted": postDate,
        "content": content,
        "authorHash": authorHash,
        "board": board,
        "parentPostId": parent
    };

    httpAsync(`${baseUrl}/api/threads`, "POST", JSON.stringify(post), function() {
        refreshCallback();
    });

    document.getElementById("reply-content").value = "";
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function setCookie(name, value) {
    let expDate = new Date();
    const expDays = 30;
    expDate.setTime(expDate.getTime() + (expDays*24*60*60*1000));

    document.cookie = `${name} = ${value} ; expires = ${expDate.toUTCString()} ; path=/;`;
}

function getCookie(name) {
    let pairs = document.cookie.split(";").map(e => {
        let split = e.split("=");
        return {
            name: split[0].trim(),
            value: split[1].trim()
        }
    });

    let result = pairs.find(p => p.name == name);
    if(result) {
        return result.value;
    } else {
        return null;
    }
}

function isLoggedIn() {
    let code = getCookie("code");
    return code !== '' && code !== undefined;
}

function onLoginClicked() {
    let code = prompt("Enter admin code");

    httpAsync(`${baseUrl}/api/admins/${code}`, "GET", null, function(response) {
        if(response == 'true') {
            setCookie("code", code);
            alert("Looged in as admin");
            if(onIsAdmin) {
                onIsAdmin();
            }
        } else {
            alert("Incorrect code");
        }
    });
}

function onPostNumClicked(number) {
    document.getElementById("reply-content").value += `>>${number}\n`;
}

function commonLoad() {
    let session = getCookie("session");
    if(session == "" || session == undefined || session == null) {
        setCookie("session", uuidv4());
    }

    if(isLoggedIn() && onIsAdmin) {
        onIsAdmin();
    }
}

function load() {
    if(pageLoad) {
        pageLoad();
    }

    commonLoad();
}
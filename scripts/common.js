const postTemplate = 
    `
    <div class="post">
        <div>
            [[[TitleTemplate]]]
            <p class="post-header normal-text">[[[PostName]]]</p>
            <a class="post-header" href="thread.html#[[[ParentPost]]]" onclick="onPostNumClicked([[[PostNumber]]])">[[[PostNumber]]]</a>
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

//const baseUrl = "https://localhost:5000";
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
                .replace(/>>[0-9]*/, (matched) => `<a href="thread.html#${parentPost}" onclick="onPostNumClicked(${matched})"> ${matched}${matched.substring(2) == parentPost ? " (OP) " : "" }</a>`)
                .replace(/>[^>|\s|\d].+/, (matched) => `<span class="quote-text"> ${matched} </span>`);
        
        final += `${line} <br />`;
    }

    return final;
}

function createPostElem(postData, onThread) {
    let postDate = new Date(postData.timestamp);
    const parentPost = postData.parentPostId ?? postData.id;
    const postDateValue = `${postDate.toISOString().split("T")[0]} ${postDate.getHours()}:${postDate.getMinutes()}`;

    let template = postTemplate
                    .replaceAll("[[[ParentPost]]]", parentPost)
                    .replaceAll("[[[PostName]]]", postData.author)
                    .replaceAll("[[[PostNumber]]]", postData.id)
                    .replaceAll("[[[PostDate]]]", postDateValue)
                    .replaceAll("[[[PostContent]]]", createPostContent(postData));

    let finalTitle = "";

    if(postData.title) {
        finalTitle = titleTemplate.replace("[[[PostTitle]]]", postData.title);
    }

    let replyButton = postData.parentPostId || onThread ? "" : replyButtonTemplate.replace("[[[ParentPost]]]", parentPost);

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

function submitNewPost(board, parent, refreshCallback) {
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
        refreshCallback();
    });

    document.getElementById("reply-content").value = "";
}

function getCookieData() {
    let contents = document.cookie;

    if(contents) {
        let elements = contents.split(';');
        return elements.map((e) => {
            let parts = e.split('=');
            return {
                name: parts[0].trim(),
                value: parts[1].trim()
            };
        });
    } else return null;
}

function writeCookie(array) {
    let final = "";

    for(let i = 0; i < array.length; ++i) {
        if(i > 0) {
            final += "; ";
        }

        const current = array[i];

        final += `${current.name} = ${current.value}`;
    }

    document.cookie = final;
}

function newCookie() {
    let expDate = new Date();
    const expDays = 30;
    expDate.setTime(expDate.getTime() + (expDays*24*60*60*1000));
    // TODO: User hash for using (You)s
    return [
        { name: "expires", value: expDate.toUTCString() },
        { name: "session", value: null }
    ];
}

function isLoggedIn() {    
    let cookie = getCookieData();
    if(!cookie) {
        cookie = newCookie();
        writeCookie(cookie);
    }

    let session = cookie.filter(e => e.name == 'session').value;
    return session && session != 'null';
}

function onLoginClicked() {
    if(isLoggedIn()) {

    } else {

    }
}

function onPostNumClicked(number) {
    document.getElementById("reply-content").value += `>>${number}\n`;
}

function commonLoad() {
    const login = document.getElementById("top-menu-login");
    const adminArea = document.getElementById("top-menu-admin-area");

    if(isLoggedIn()) {
        login.innerText = "Logout";
        adminArea.style.display = 'initial';
    } else {
        login.innerText = "Login";
    }
}

function load() {
    if(pageLoad) {
        pageLoad();
    }

    commonLoad();
}
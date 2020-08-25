function newPost() {
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
        "parentPostId": getPageArgument()
    };

    httpAsync(`${baseUrl}/api/threads`, "POST", JSON.stringify(post), function() {
        refreshThreads();
    });

    document.getElementById("reply-content").value = "";
}

var onQuoteLink = function (target) {
    onQuote(">>" + target.innerText);
};

function onQuote(postNumber) {
    document.getElementById("reply-content").value += postNumber + "\n";
}

function setupThread(thread) {
    for(let index = 0; index < thread.children.length; ++index) {
        let post = thread.children[index];
        let elem = createPostElem(post);
        document.body.appendChild(elem);
    }
}

function setupTitle(board) {
    let text = `${board.title} - /${board.route}/\n${board.description}`;
    document.getElementById("board-title").innerText = text;
    document.title = text;
}

function load() {
    let threadNum = getPageArgument();

    httpAsync(`${baseUrl}/api/threads/${threadNum}`, "GET", null, function(thread) {
        httpAsync(`${baseUrl}/api/boards/${thread.board}`, "GET", null, function (board) {
            setupTitle(JSON.parse(board));
        });

        setupThread(JSON.parse(thread));
    });
}
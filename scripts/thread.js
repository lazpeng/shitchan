let g_board = "";

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
        "board": g_board,
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

function setupTitle(board, thread) {
    let text = `${board.title} - /${board.route}/\n${board.description}`;
    document.getElementById("board-title").innerText = text;
    document.title = `${thread.parentPostId} - ${text}`;
    g_board = board.route;
}

function load() {
    let threadNum = getPageArgument();

    httpAsync(`${baseUrl}/api/threads/${threadNum}`, "GET", null, function(content) {
        let thread = JSON.parse(content);

        httpAsync(`${baseUrl}/api/boards/${thread.board}`, "GET", null, function (board) {
            setupTitle(JSON.parse(board));
        });

        setupThread(thread);
    });
}
let g_board = "";

function newPost() {
    submitNewPost(g_board, Number(getPageArgument()), refresh);
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

function refresh() {

}

function load() {
    let threadNum = getPageArgument();

    httpAsync(`${baseUrl}/api/threads/${threadNum}`, "GET", null, function(content) {
        let thread = JSON.parse(content);

        httpAsync(`${baseUrl}/api/boards/${thread.board}`, "GET", null, function (board) {
            setupTitle(JSON.parse(board), thread);
        });

        setupThread(thread);
    });
}
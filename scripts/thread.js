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
    const postList = document.getElementById("post-list");
    for(let index = 0; index < thread.children.length; ++index) {
        let post = thread.children[index];
        let elem = createPostElem(post, true);
        postList.appendChild(elem);
    }
}

function setupTitle(board, thread) {
    const text = `${board.title} - /${board.route}/\n${board.description}`;
    document.getElementById("board-title").innerText = text;
    document.title = `${thread.parentPostId} - ${text}`;
    g_board = board.route;

    const back = document.getElementById("back-button");
    back.href = `board.html#${board.route}`;
    back.style.display = 'initial';
}

function refresh(onRefreshedCallback) {
    const postList = document.getElementById("post-list");
    while (postList.firstChild) {
        postList.removeChild(postList.lastChild);
    }

    const threadNum = getPageArgument();

    httpAsync(`${baseUrl}/api/threads/${threadNum}`, "GET", null, function(content) {
        let thread = JSON.parse(content);

        if(onRefreshedCallback) {
            onRefreshedCallback(thread);
        }

        setupThread(thread);
    });
}

function pageLoad() {
    refresh((thread) => {
        httpAsync(`${baseUrl}/api/boards/${thread.board}`, "GET", null, function (board) {
            setupTitle(JSON.parse(board), thread);
        });
    });
}
let g_threads = [];

function setupBoard(board) {
    document.getElementById("board-title").innerText = `${board.title} - /${board.route}/\n${board.description}`;
    document.title = `${board.title} - /${board.route}/\n${board.description}`;
}

function setupThreads(threads) {
    let postList = document.getElementById("post-list");

    for(let thread of threads) {
        for(let index = 0; index < thread.children.length; ++index) {
            postList.appendChild(createPostElem(thread.children[index]));
        }
    }
}

function refreshThreads() {
    // Clear posts
    let postList = document.getElementById("post-list");
    while (postList.firstChild) {
        postList.removeChild(postList.lastChild);
    }

    httpAsync(`${baseUrl}/api/threads/board/${getPageArgument()}`, "GET", null, function(body) {
        g_threads = JSON.parse(body);

        setupThreads(g_threads);
    });
}

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
        "parentPostId": null,
        "board": getPageArgument()
    };

    httpAsync(`${baseUrl}/api/threads/${getPageArgument()}`, "POST", JSON.stringify(post), function() {
        refreshThreads();
    });

    document.getElementById("reply-content").value = "";
}

function load() {
    httpAsync(`${baseUrl}/api/boards/${getPageArgument()}`, "GET", null, function(body) {
        let board = JSON.parse(body);

        setupBoard(board);

        refreshThreads();
    });
}
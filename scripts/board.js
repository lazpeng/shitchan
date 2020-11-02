let g_threads = [];

const emptyTemplate =
    `
        <p class="normal-text empty-board">No threads to show</p>
    `;

function setupBoard(board) {
    document.getElementById("board-title").innerText = `${board.title} - /${board.route}/\n${board.description}`;
    document.title = `${board.title} - /${board.route}/\n${board.description}`;
}

function setupThreads(threads) {
    let postList = document.getElementById("post-list");

    for(let thread of threads) {
        for(let index = 0; index < thread.children.length; ++index) {
            postList.appendChild(createPostElem(thread.children[index], false, thread));
        }
    }

    if(threads.length == 0) {
        let elem = document.createElement("div");
        elem.innerHTML = emptyTemplate;
        postList.appendChild(elem);
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
    submitNewPost(getPageArgument(), null, refreshThreads);
}

function onIsAdmin() {
    setupThreads(g_threads);
}

function pageLoad() {
    httpAsync(`${baseUrl}/api/boards/${getPageArgument()}`, "GET", null, function(body) {
        let board = JSON.parse(body);

        setupBoard(board);

        refreshThreads();
    });
}
const boardTemplate =
    `
        <tr>
            <td><a class="text" href="board.html#[[[boardRoute]]]">/[[[boardRoute]]]/</td>
            <td><a class="text" href="board.html#[[[boardRoute]]]">[[[boardName]]]</td>
            <td class="darker-text">[[[boardDescription]]]</td>
        </tr>
    `;
const boardListTemplate =
    `
    <tbody id="board-list-body">
    <tr>
        <th class="normal-text">URL</th>
        <th class="normal-text">Name</th>
        <th class="normal-text">Description</th>
    </tr>
    </tbody>
    `;

function createBoardElem(board) {
    let template = boardTemplate
                        .replaceAll("[[[boardRoute]]]", board.route)
                        .replaceAll("[[[boardName]]]", board.title)
                        .replaceAll("[[[boardDescription]]]", board.description);
    
    let elem = document.createElement("tr");
    elem.innerHTML = template;
    return elem;
}

function setupBoards(boards) {
    let root = document.getElementById("board-list-body");

    for(let board of boards) {
        root.appendChild(createBoardElem(board));
    }
}

function onIsAdmin() {
    document.getElementById("new-board").style.display = "block";
}

function refreshBoards() {
    document.getElementById("board-list-body").innerHTML = boardListTemplate;

    httpAsync(`${baseUrl}/api/boards`, "GET", null, function(body) {
        let boards = JSON.parse(body);

        setupBoards(boards);
    });
}

function onNewBoard() {
    let route = prompt("Enter a route for the board (without the /)");
    let title = prompt("Enter a title");
    let description = prompt("Enter a description");
    let code = getCookie("code");

    if(route == null || title == null || description == null) {
        alert("Operation aborted");
        return;
    }

    let request = {
        title: title,
        route: route,
        description: description,
        code: code
    };

    httpAsync(`${baseUrl}/api/boards`, "POST", JSON.stringify(request), function() {
        refreshBoards();
    });
}

function pageLoad() {
    refreshBoards();
}
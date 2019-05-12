class View extends Observer {

    constructor(controller) {
        super();
        this._controller = controller;
        this._controller.model.registerObserver(this);
    }

    addChildEntity(parentIndex, title) {
        const titleWithoutWitespaces = title.replace(/\s/g, "");
        if (!titleWithoutWitespaces) {
            meep_moop(document.getElementById(`titleInput-${parentIndex}`));
        } else {
            this._controller.addChildEntity(parentIndex, title);
            const addedChildIndex = this._controller.lastChildIndex(parentIndex)
            focusElement(document.getElementById(`entity-${String(parentIndex)}-${addedChildIndex}`));
        }
    }

    deleteEntityById(elementId) {
        const [elementType, parentIndex, childIndex] = elementId.split("-");
        if (elementType === "entity" && childIndex !== "null") {
            this._controller.handleDeleteEntity(parseIntRespectingNull(parentIndex), parseIntRespectingNull(childIndex));
        } else {
            meep_moop(document.getElementById(elementId));
        }
    }

    makeTitleTextareaListItem(entityCreator, index) {
        const titleTextareaElement = document.createElement("textarea");
        setAttributes(titleTextareaElement, {
            "id": `textarea-${index}`,
            "class": "title-textarea",
            "placeholder": entityCreator.inputPlaceholder,
            "rows": "2",
        });
        titleTextareaElement.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.addChildEntity(index, titleTextareaElement.value);
            }
        });

        const cardElement = document.createElement("LI");
        setAttributes(cardElement, {
            "id": `titleInput-${index}`,
            "class": "card",
        });

        if (!entityCreator.addSectionInsidesShown) {
            cardElement.setAttribute("style", "display:none;");
        } else {
            focusElement(titleTextareaElement);
        }

        cardElement.appendChild(titleTextareaElement);

        return cardElement;
    }

    makeAddSectionInsidesListItem(entityCreator, index) {
        const addButtonElement = document.createElement("button");
        setAttributes(addButtonElement, {
            "id": `addBtn-${index}`,
            "class": "add-btn",
            "type": "submit",
        });

        addButtonElement.innerText = entityCreator.addButtonText;
        addButtonElement.addEventListener("click", (e) => {
            e.stopPropagation();
            let title = document.getElementById(`textarea-${index}`).value;
            this.addChildEntity(index, title);
        });

        const crossInputElement = document.createElement("input");
        setAttributes(crossInputElement, {
            "id": `cross-${index}`,
            "class": "svg-ico cross-ico unselectable",
            "type": "image",
            "alt": "X",
            "src": "img/cross.svg",
        });

        const insidesElement = document.createElement("li");
        const hideInsides = !entityCreator.addSectionInsidesShown;
        setAttributes(insidesElement, {
            "id": `insides-${index}`,
            "class": "add-section-insides last-card unselectable",
            "style": hideInsides ? "display:none;" : "",
        });
        insidesElement.appendChild(addButtonElement);
        insidesElement.appendChild(crossInputElement);
        insidesElement.addEventListener("click", (e) => 
            this._controller.handleCrossClick(e));

        return insidesElement;
    }


    makeCardsElement(cards, entityCreator, index) {
        const cardsElement = document.createElement("OL");
        setAttributes(cardsElement, {
            "id": `cards-${index}`,
            "class": "cards",
        });

        for (let j = 0; j < cards.length; j++) {
            let cardElement = document.createElement("LI");
            setAttributes(cardElement, {
                "id": `entity-${index}-${j}`,
                "class": `card${j === cards.length - 1 && !entityCreator.addSectionInsidesShown ? " last-card" : ""}`,
                "draggable": "true",
                "tabindex": "-1",
            });
            cardElement.addEventListener("click", (e) => {
                e.stopPropagation();
                e.target.focus();
            });            
            cardElement.addEventListener("keydown", (e) => {
                e.stopPropagation();                
                if (e.key === "Delete") {
                    this.deleteEntityById(e.target.id);
                }
            });

            cardElement.addEventListener("dragstart",
                (e) => this._controller.handleDragStart(e), false);
            cardElement.addEventListener("dragenter",
                (e) => this._controller.handleDragEnter(e), false)
            cardElement.addEventListener("dragover",
                (e) => this._controller.handleDragOver(e), false);
            cardElement.addEventListener("dragleave",
                (e) => this._controller.handleDragLeave(e), false);
            cardElement.addEventListener("drop",
                (e) => this._controller.handleDrop(e), false);
            cardElement.addEventListener("dragend",
                (e) => this._controller.handleDragEnd(e), false);
            cardElement.innerText = cards[j].title;

            cardsElement.appendChild(cardElement);
        }

        if (cards.length === 0 && !entityCreator.addSectionInsidesShown) {
            cardsElement.setAttribute("style", "display:none;");
        }

        const titleTextarea = this.makeTitleTextareaListItem(entityCreator, index)
        const addSectionInsides = this.makeAddSectionInsidesListItem(entityCreator, index)
        cardsElement.appendChild(titleTextarea);
        cardsElement.appendChild(addSectionInsides);

        return cardsElement;
    }

    makeFacadeElement(entityCreator, index) {
        const plusInputElement = document.createElement("input");
        setAttributes(plusInputElement, {
            "id": `plus-${index}`,
            "class": "svg-ico plus-ico unselectable",
            "type": "image",
            "alt": "+",
            "src": "img/plus.svg",
        });

        const facadeTextElement = document.createElement("p");
        facadeTextElement.setAttribute("class", "add-section-facade-text unselectable");
        facadeTextElement.innerText = entityCreator.facadeText;

        const facadeElement = document.createElement("div");
        facadeElement.setAttribute("class", "add-section-facade");
        facadeElement.setAttribute("id", `facade-${index}`);

        if (index !== null) {
            facadeElement.addEventListener("dragenter",
                (e) => this._controller.handleDragEnter(e), true);
            facadeElement.addEventListener("dragover",
                (e) => this._controller.handleDragOver(e), true);
            facadeElement.addEventListener("dragleave",
                (e) => this._controller.handleDragLeave(e), true);
            facadeElement.addEventListener("drop",
                (e) => this._controller.handleDrop(e), true);
            facadeElement.addEventListener("dragend",
                (e) => this._controller.handleDragEnd(e), true);
        }

        facadeElement.appendChild(plusInputElement);
        facadeElement.appendChild(facadeTextElement);

        if (entityCreator.addSectionInsidesShown) {
            facadeElement.setAttribute("style", "display:none;");
        }

        facadeElement.addEventListener("click", (e) => {
            this._controller.handleFacadeClick(e)
            const index = e.target.id.split("-")[1];
            scrollToBottom(document.getElementById(`cards-${index}`));
        });

        return facadeElement;
    }

    makeBoardElement(entityManager, index) {
        const boardElement = document.createElement("div");
        setAttributes(boardElement, {
            "id": `entity-null-${index}`,
            "class": "board",
            "tabindex": "-2",
        });
        boardElement.addEventListener("click", (e) => {
            e.stopPropagation();
            e.target.focus();
        });
        boardElement.addEventListener("keydown", (e) => {
            e.stopPropagation();
            const targeElementType = e.target.id.split("-")[0];                
            if (e.key === "Delete" && targeElementType !== "textarea") {
                this.deleteEntityById(e.target.id);
            }
        });

        let cards = [];
        if (entityManager.title != null) {
            cards = entityManager.childEntities;

            const titleElement = document.createElement("h3");
            titleElement.setAttribute("class", "board-title unselectable");
            titleElement.innerText = entityManager.title;

            boardElement.appendChild(titleElement);
        }

        const cardsElement = this.makeCardsElement(cards, entityManager.childEntityCreator, index);
        const facadeElement = this.makeFacadeElement(entityManager.childEntityCreator, index);

        boardElement.appendChild(cardsElement);
        boardElement.appendChild(facadeElement);

        return boardElement;
    }

    update(data) {

        const wallElement = document.getElementsByClassName("wall")[0];
        while (wallElement.firstChild) {
            wallElement.removeChild(wallElement.firstChild);
        }

        for (let i = 0; i < data.boards.length; i++) {
            let board = data.boards[i];
            wallElement.appendChild(this.makeBoardElement(board, i));
        }

        wallElement.appendChild(this.makeBoardElement(data.boardManager, null));

        document.onkeydown = (e) => {
            if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                switch (e.keyCode) {
                    case 83:
                        this._controller.saveBoardsStateToLocalStorage();
                        break;
                    case 90:
                        this._controller.loadPreviousBoardsState();
                        break;
                    case 76:
                        this._controller.loadBoardsStateFromLocalStorage();
                        break;
                    case 73:
                        this._controller.loadInitialBoardsState();
                        break;
                }
            };
        }
    }
}
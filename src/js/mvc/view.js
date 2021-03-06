import Observer from './observer';
import Controller from './controller';
import Model from './model';
import TitledEntityManager from '../components/titledEntityManager';
import Card from '../components/card';
import {
  focusElement, setAttributes, scrollToBottom,
} from '../helpers/viewHelpers';
import elementText from '../data/elementText';
import crossIco from '../../img/cross.svg';
import plusIco from '../../img/plus.svg';

/**
 * Major pillar of application, responsible for rendering the state into HTML.
 * @extends Observer
 */
class View extends Observer {
  /**
   * Constructs a View corresponding to `controller`.
   *
   * @param {Controller} controller Corresponding Controller
   */
  constructor(controller) {
    super();
    this._controller = controller;
    this._controller.model.registerObserver(this);
  }

  /**
   * Makes <ol> cards element of `cards` array corresponding to
   * `entityManager` with `index`.
   *
   * @param {Card[]} cards Array of Card instances to be placed as elements
   * @param {TitledEntityManager} entityManager Parent entityManager
   * @param {?number} index Index of parent entityManager (null corresponds to the Wall)
   * @returns {Element}
   */
  makeCardsElement(cards, entityManager, index) {
    const cardsElement = document.createElement('OL');
    setAttributes(cardsElement, new Map([
      ['id', `cards-${index}`],
      ['class', 'cards'],
    ]));

    for (let j = 0; j < cards.length; j += 1) {
      const cardElement = document.createElement('LI');
      const isLastVisibleCard = j === cards.length - 1 && !entityManager.insidesShown;
      const attrMap = new Map([
        ['id', `entity-${index}-${j}`],
        ['class', `card${isLastVisibleCard ? ' last-card' : ''}`],
        ['draggable', 'true'],
        ['tabindex', '-1'],
      ]);
      if (cards[j].href != null) {
        attrMap.set('onclick', `location.href='${cards[j].href}'`);
        attrMap.set('class', `${attrMap.get('class')} link`);
      }
      setAttributes(cardElement, attrMap);
      cardElement.innerText = cards[j].title;

      cardElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.target.focus();
      });
      cardElement.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Delete') {
          this._controller.handleDeleteKeydown(e);
        }
      });
      cardElement.addEventListener('dragstart',
        e => this._controller.handleDragStart(e), false);
      cardElement.addEventListener('dragenter',
        e => this._controller.handleDragEnter(e), false);
      cardElement.addEventListener('dragover',
        e => this._controller.handleDragOver(e), false);
      cardElement.addEventListener('dragleave',
        e => this._controller.handleDragLeave(e), false);
      cardElement.addEventListener('drop',
        e => this._controller.handleDrop(e), false);
      cardElement.addEventListener('dragend',
        e => this._controller.handleDragEnd(e), false);

      cardsElement.appendChild(cardElement);
    }

    if (cards.length === 0 && !entityManager.insidesShown) {
      cardsElement.setAttribute('style', 'display:none;');
    }
    const titleTextarea = this.makeTitleTextareaListItem(entityManager, index);
    const addSectionInsides = this.makeAddSectionInsidesListItem(entityManager, index);
    cardsElement.appendChild(titleTextarea);
    cardsElement.appendChild(addSectionInsides);


    return cardsElement;
  }

  /**
   * Makes <li> element with textarea for title input corresponding to
   * `entityManager` with `index`.
   *
   * @param {TitledEntityManager} entityManager Parent entityManager
   * @param {?number} index Index of parent entityManager (null corresponds to the Wall)
   * @returns {Element}
   */
  makeTitleTextareaListItem(entityManager, index) {
    const childClass = entityManager.childEntityClass;
    const titleTextareaElement = document.createElement('textarea');
    setAttributes(titleTextareaElement, new Map([
      ['id', `textarea-${index}`],
      ['class', 'title-textarea'],
      ['placeholder', elementText.entityAdder.get(childClass).inputPlaceholder],
      ['rows', '2'],
    ]));
    titleTextareaElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._controller.addChildEntity(index, titleTextareaElement.value);
      }
    });

    const cardElement = document.createElement('LI');
    setAttributes(cardElement, new Map([
      ['id', `titleInput-${index}`],
      ['class', 'card'],
    ]));

    if (!entityManager.insidesShown) {
      cardElement.setAttribute('style', 'display:none;');
    } else {
      focusElement(titleTextareaElement);
    }

    cardElement.appendChild(titleTextareaElement);

    return cardElement;
  }

  /**
   * Makes <li> element with addTitle and cross buttons and corresponding to
   * `entityManager` with `index`.
   *
   * @param {TitledEntityManager} entityManager Parent entityManager
   * @param {?number} index Index of parent entityManager (null corresponds to the Wall)
   * @returns {Element}
   */
  makeAddSectionInsidesListItem(entityManager, index) {
    const childClass = entityManager.childEntityClass;
    const addButtonElement = document.createElement('button');
    setAttributes(addButtonElement, new Map([
      ['id', `addBtn-${index}`],
      ['class', 'add-btn'],
      ['type', 'submit'],
    ]));

    addButtonElement.innerText = elementText.entityAdder.get(childClass).addButtonText;
    addButtonElement.addEventListener('click', (e) => {
      e.stopPropagation();
      const title = document.getElementById(`textarea-${index}`).value;
      this._controller.addChildEntity(index, title);
    });

    const crossInputElement = document.createElement('input');
    setAttributes(crossInputElement, new Map([
      ['id', `cross-${index}`],
      ['class', 'svg-ico cross-ico unselectable'],
      ['type', 'image'],
      ['alt', 'X'],
      ['src', crossIco],
    ]));

    const insidesElement = document.createElement('li');
    setAttributes(insidesElement, new Map([
      ['id', `insides-${index}`],
      ['class', 'add-section-insides unselectable'],
      ['style', !entityManager.insidesShown ? 'display:none;' : ''],
    ]));
    insidesElement.appendChild(addButtonElement);
    insidesElement.appendChild(crossInputElement);
    insidesElement.addEventListener('click', e => this._controller.handleCrossClick(e));

    return insidesElement;
  }

  /**
   * Makes <div> element corresponding to `entityManager` with `index`,
   * which reveals addSection on click.
   *
   * @param {TitledEntityManager} entityManager Parent entityManager
   * @param {?number} index Index of parent entityManager (null corresponds to the Wall)
   * @returns {Element}
   */
  makeFacadeElement(entityManager, index) {
    const childClass = entityManager.childEntityClass;
    const plusInputElement = document.createElement('input');
    setAttributes(plusInputElement, new Map([
      ['id', `plus-${index}`],
      ['class', 'svg-ico plus-ico unselectable'],
      ['type', 'image'],
      ['alt', '+'],
      ['src', plusIco],
    ]));

    const facadeTextElement = document.createElement('p');
    facadeTextElement.setAttribute('class', 'add-section-facade-text unselectable');
    facadeTextElement.innerText = elementText.entityAdder.get(childClass).facadeInnerText;

    const facadeElement = document.createElement('div');
    setAttributes(facadeElement, new Map([
      ['id', `facade-${index}`],
      ['class', 'add-section-facade'],
    ]));

    if (index !== null) {
      facadeElement.addEventListener('dragenter',
        e => this._controller.handleDragEnter(e), true);
      facadeElement.addEventListener('dragover',
        e => this._controller.handleDragOver(e), true);
      facadeElement.addEventListener('dragleave',
        e => this._controller.handleDragLeave(e), true);
      facadeElement.addEventListener('drop',
        e => this._controller.handleDrop(e), true);
      facadeElement.addEventListener('dragend',
        e => this._controller.handleDragEnd(e), true);
    }

    facadeElement.appendChild(plusInputElement);
    facadeElement.appendChild(facadeTextElement);

    if (entityManager.insidesShown) {
      facadeElement.setAttribute('style', 'display:none;');
    }

    facadeElement.addEventListener('click', (e) => {
      this._controller.handleFacadeClick(e);
      const addedCardIndex = e.target.id.split('-')[1];
      scrollToBottom(document.getElementById(`cards-${addedCardIndex}`));
    });

    return facadeElement;
  }

  /**
   * Makes HTML representation of `entityManager` with `index`.
   *
   * @param {TitledEntityManager} entityManager Parent entityManager
   * @param {?number} index Index of parent entityManager (null corresponds to the Wall)
   * @returns {Element}
   */
  makeBoardElement(entityManager, index) {
    const boardElement = document.createElement('div');
    setAttributes(boardElement, new Map([
      ['id', `entity-null-${index}`],
      ['class', 'board'],
      ['tabindex', '-2'],
    ]));
    boardElement.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.focus();
    });
    boardElement.addEventListener('keydown', (e) => {
      e.stopPropagation();
      const targeElementType = e.target.id.split('-')[0];
      if (e.key === 'Delete' && targeElementType !== 'textarea') {
        this._controller.handleDeleteKeydown(e);
      }
    });

    let cards = [];
    if (entityManager.title != null) {
      cards = entityManager.childEntities;

      const titleElement = document.createElement('h3');
      titleElement.setAttribute('class', 'board-title unselectable');
      titleElement.innerText = entityManager.title;

      boardElement.appendChild(titleElement);
    }

    const cardsElement = this.makeCardsElement(cards, entityManager, index);
    const facadeElement = this.makeFacadeElement(entityManager, index);

    boardElement.appendChild(cardsElement);
    boardElement.appendChild(facadeElement);

    return boardElement;
  }

  /**
   * Renders application state into HTML.
   *
   * @param {Model} model Model with updated application state.
   */
  update(model) {
    const wallElement = document.getElementsByClassName('wall')[0];
    while (wallElement.firstChild) {
      wallElement.removeChild(wallElement.firstChild);
    }

    for (let i = 0; i < model.boards.length; i += 1) {
      const board = model.boards[i];
      wallElement.appendChild(this.makeBoardElement(board, i));
    }

    wallElement.appendChild(this.makeBoardElement(model.wall, null));

    document.addEventListener('keydown', (e) => {
      if ((window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        switch (e.keyCode) {
          case 83:
            e.preventDefault();
            this._controller.saveStateToLocalStorage();
            break;
          case 90:
            e.preventDefault();
            this._controller.loadPreviousState();
            break;
          case 76:
            e.preventDefault();
            this._controller.loadStateFromLocalStorage();
            break;
          case 73:
            e.preventDefault();
            this._controller.loadInitialState();
            break;
          default:
            break;
        }
      }
    }, true);
  }
}

export default View;

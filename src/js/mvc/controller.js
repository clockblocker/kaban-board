/* eslint-disable max-len */
import Model from './model';
import LocalStorageManager from '../helpers/localStorageManager';
import TitledEntityManager from '../components/titledEntityManager';
import State from '../components/state';
import { parseIntOrNull, getElementIndices, has } from '../helpers/general';
import { scrollToBottom, wiggleElement, focusElement } from '../helpers/viewHelpers';
import initialState from '../data/initialState';
import TitledEntity from '../components/titledEntity';


/* eslint-disable class-methods-use-this */
/**
 * Major pillar of application, responsible for handling events passed from View
 * via changing the state inside Model.
 */
class Controller {
  /**
   * Constructs a Controller corresponding to `model`.
   *
   * @param {Model} model Corresponding Model
   */
  constructor(model) {
    this._model = model;
    this._draggedElement = null;
  }

  get model() {
    return this._model;
  }

  updatePreviousState() {
    // Deep cloning
    this.model.previousState = LocalStorageManager.decodeState(LocalStorageManager.encode(this.model.state));
  }

  saveStateToLocalStorage() {
    LocalStorageManager.saveState(this.model.state);
  }

  /**
   * Loads `state` into model.
   *
   * @param {State} state New state
   */
  loadState(state) {
    if (state !== this.model.state) {
      this.model.state = state;
      this.model.notifyAll();
    }
  }

  loadStateFromLocalStorage() {
    this.updatePreviousState();
    this.loadState(LocalStorageManager.loadState());
  }

  loadInitialState() {
    this.updatePreviousState();
    this.loadState(LocalStorageManager.decodeState(JSON.stringify(initialState)));
  }

  loadPreviousState() {
    this.loadState(this.model.previousState);
  }

  /**
   * Constructs an object with Boards corresponding to their indices
   * and Wall corresponding to null.
   *
   * @returns {Object}
   */
  getEntityManagersDict() {
    const entityManagersDict = { null: this.model.wall };
    for (let i = 0; i < this.model.boards.length; i += 1) {
      entityManagersDict[i] = this.model.boards[i];
    }
    return entityManagersDict;
  }

  /**
   * Retreives EntityManager with `parentIndex` index.
   *
   * @param {number|null} parentIndex Index of EntityManager
   * @returns {TitledEntityManager}
   */
  getEntityManagerWithIndex(parentIndex) {
    return this.getEntityManagersDict()[parentIndex];
  }

  /**
   * Computes index of the last child of entityMagader
   * with `parentIndex` index.
   *
   * @param {number|null} parentIndex Index of EntityManager
   * @returns {TitledEntityManager}
   */
  lastChildIndex(parentIndex) {
    return this.getEntityManagersDict()[parentIndex].childEntities.length - 1;
  }

  focusEntityElementWithIndices(parentIndex, childIndex) {
    childIndex = childIndex != null ? childIndex : this.lastChildIndex(parentIndex);
    focusElement(document.getElementById(`entity-${String(parentIndex)}-${childIndex}`));
  }

  /**
   * Adds appropriate TitledEntity with `title` to entityManager with `parentIndex` index
   * then focuses added entity.
   * If `title` consists entierly of whitspace characters, corresponding to `parentIndex`
   * titleInput will be wiggled.
   *
   * @param {number|null} parentIndex Index of the parent entityManager (null corresponds to the Wall)
   * @param {string} title Title of added entity
   */
  addChildEntity(parentIndex, title) {
    const titleWithoutWitespaces = title.replace(/\s/g, '');
    if (!titleWithoutWitespaces) {
      wiggleElement(document.getElementById(`titleInput-${parentIndex}`));
    } else {
      this.updatePreviousState();
      this.incertEntity(parentIndex, null, this.createEntity(parentIndex, title));
      this.model.notifyAll();
      const addedChildIndex = this.lastChildIndex(parentIndex);
      this.focusEntityElementWithIndices(parentIndex, addedChildIndex);
      if (parentIndex != null) {
        scrollToBottom(document.getElementById(`cards-${parentIndex}`));
      }
    }
  }

  deleteEntity(parentIndex, childIndex) {
    this.updatePreviousState();
    this.getEntityManagerWithIndex(parentIndex).deleteChildEntityWithIndex(childIndex);
  }

  /**
   * Creates TitledEntity with `title` corresponing to entityManager with `parentIndex` index.
   *
   * @param {number|null} parentIndex Index of the parent entityManager (null corresponds to the Wall)
   * @param {string} title Created entity title.
   */
  createEntity(parentIndex, title) {
    return this.getEntityManagerWithIndex(parentIndex).makeChildEntity(title);
  }

  /**
   * Incerts `entity` to `childIndex` position in entityManager with index `parentIndex` children list.
   *
   * @param {number|null} parentIndex Index of the parent entityManager (null corresponds to the Wall)
   * @param {number|null} childIndex Position in parent's children list (null corresponds to the last posotion)
   * @param {TitledEntity} entity Entity to be incerted
   */
  incertEntity(parentIndex, childIndex, entity) {
    const entityManager = this.getEntityManagerWithIndex(parentIndex);
    entityManager.incertChildEntity(entity, childIndex);
    if (has(entityManager, 'insidesShown')) {
      entityManager.insidesShown = false;
    }
  }

  /**
   * Delete entity corresponding to `e`'s target id and update the View.
   * If such entity should not be deleted, it's element be wiggled.
   *
   * @param {KeyboardEvent} e Event to be handeled
   */
  handleDeleteKeydown(e) {
    const elementId = e.target.id;
    const [elementType, parentStrIndex, childStrIndex] = elementId.split('-');

    if (elementType === 'entity' && childStrIndex !== 'null') {
      this.deleteEntity(parseIntOrNull(parentStrIndex), parseIntOrNull(childStrIndex));
      this.model.notifyAll();
    } else {
      wiggleElement(document.getElementById(elementId));
    }
  }

  handleFacadeClick(e) {
    const parentStrIndex = e.target.id.split('-')[1];
    const entityManagerDict = this.getEntityManagersDict();
    for (const strIndex of Object.keys(entityManagerDict)) {
      entityManagerDict[strIndex].insidesShown = strIndex === parentStrIndex;
    }

    this.model.notifyAll();
  }

  handleCrossClick(e) {
    const parentIndex = parseIntOrNull(e.target.id.split('-')[1]);
    this.getEntityManagerWithIndex(parentIndex).insidesShown = false;
    this.model.notifyAll();
  }

  handleDragStart(e) {
    const targetElement = e.target;
    this._draggedElement = targetElement;

    const ghostElement = targetElement.cloneNode(true);
    ghostElement.classList.add('ghost');
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    targetElement.classList.add('empty-slot');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', targetElement.innerHTML);
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  handleDragEnter(e) {
    const targetElement = e.target;
    if (targetElement.id) {
      targetElement.classList.add('over');
    }
  }

  handleDragLeave(e) {
    const targetElement = e.target;
    if (targetElement.id) {
      targetElement.classList.remove('over');
    }
  }

  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const targetElement = e.target;
    if (this._draggedElement !== targetElement && targetElement.id) {
      let [targetParentIndex, targetChildIndex] = getElementIndices(targetElement);
      if (targetParentIndex == null) {
        [targetParentIndex, targetChildIndex] = [targetChildIndex, null];
      }
      const [draggedParentIndex, draggedChildIndex] = getElementIndices(this._draggedElement);
      const draggedEntity = this.model.getEntityWithIndices(draggedParentIndex, draggedChildIndex);

      this.deleteEntity(draggedParentIndex, draggedChildIndex);
      this.incertEntity(targetParentIndex, targetChildIndex, draggedEntity);
      this.model.notifyAll();
      this.focusEntityElementWithIndices(targetParentIndex, targetChildIndex);
    }

    return false;
  }

  handleDragEnd(e) {
    e.target.classList.remove('empty-slot');
    const cardElements = document.querySelectorAll('.card');
    [].forEach.call(cardElements, (card) => {
      card.classList.remove('over');
    });
  }
}

export default Controller;

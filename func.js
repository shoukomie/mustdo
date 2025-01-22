const fs = require('fs'); // for long term storage handling
const path = require('path'); // for system pathing
const Sortable = require('sortablejs'); // for drag and drop sortability!!

const storagePath = path.join(__dirname, '..', '..', 'resources', 'todolist.json') // creates path for storage json

class ListItem {
    constructor(title, tag, description, duedate, importance, isComplete) {
        this.title = title;
        this.tag = tag;
        this.description = description;
        this.duedate = duedate;
        this.importance = importance;
        this.isComplete = isComplete;
        this.tagImportance = {}; // 'subobjects' which can store the importance data for one object in multiple different tags!!
    }
}


var todolist = [];
var tagColors = {};

// saves todolist array to json
function writeList() {
    try {
        const data = {
            todolist: todolist,
            tagColors: tagColors
        };
        fs.writeFileSync(storagePath, JSON.stringify(data));
        console.log('Data written to', storagePath);
    } catch (err) {
        console.error('Error writing to todolist.json:', err);
    }
}

// loads todolist array from the json, if it does not exist yet it creates one with template tasks!
function readList() {
    try {
        if (fs.existsSync(storagePath)) { // IF THE FILE EXISTS AT THE PATH
            console.log('Reading data from', storagePath);
            const data = fs.readFileSync(storagePath, 'utf8'); // we are reading from the storage path with utf8 character encoding
            console.log('Raw data:', data);
            const parsedData = JSON.parse(data); // turns json into js object, wherein there are attributes todolist and tagColors, both holding arrays and or an object with attributes for each tag...woah...

            console.log('Parsed data:', parsedData);
            todolist = parsedData.todolist || []; // assigning read data to variables
            tagColors = parsedData.tagColors || {};
            console.log('todolist:', todolist);
            console.log('tagColors:', tagColors);
        } else { // else we make the file! with the following data...
            console.log('File does not exist, creating with default data');
            todolist = [
                new ListItem("This is a task!", "homework", "This is a description!", "", 1, false, {}),
                new ListItem("is a task!", "personal", "is a description!", "", 2, false, {}),
                new ListItem("a task!", "homework", "a description!", "", 3, false, {}),
                new ListItem("task!", "personal", "description!", "", 4, false, {})
            ];
            tagColors = {};
            writeList(); // save the initial data to the file
        }
    } catch (err) {
        console.error('Error reading from todolist.json:', err);
    }
}


const tabsBar = document.getElementById('tabs-bar');
const container = document.getElementById('container');


// updates importance based on order of the existing todo-item elements
function updateImportance() {
    const listItems = container.querySelectorAll('.list-item');
    listItems.forEach((item, newIndex) => {
        const originalIndex = item.dataset.index;
        if (activeTab && activeTab.textContent !== 'ALL') { // if there is an active tab and it is not ALL, tag importance must be employed
            const tag = activeTab.textContent;
            todolist[originalIndex].tagImportance[tag] = newIndex + 1; //changing tag importance!
        } else {
            todolist[originalIndex].importance = newIndex + 1; // changing original importance.
        }
    });
    writeList(); // save pls
}

// for making pastes plaintext because i was pasting with html formatting for some reason hahahah
function plaintextPaste(event) {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text'); // takes plaintext
    document.execCommand('insertText', false, text); // inserts it wherever the paste is happening...
}


// constructs and appends list items to 'container' --> the "renderer" :D
function populateList() {
    container.innerHTML = '';

    let filteredList = todolist;
    if (activeTab && activeTab.textContent !== 'ALL') {
        filteredList = tagFilteredList(activeTab.textContent);
        filteredList.sort((a, b) => (a.tagImportance[activeTab.textContent] || 0) - (b.tagImportance[activeTab.textContent] || 0));
    } else {
        filteredList.sort((a, b) => a.importance - b.importance);
    }

    filteredList.forEach((item) => {
        const listItemDiv = document.createElement('div');
        listItemDiv.className = 'list-item';
        listItemDiv.dataset.index = todolist.indexOf(item); // stores original index, to access todolist from filteredList

        // following blocks create elements within the html and then edit them

        const checkBoxDiv = document.createElement('div');
        checkBoxDiv.className = 'check-box-div';

        const checkBox = document.createElement('input');
        checkBox.className = 'check-box';
        checkBox.type = 'checkbox';
        checkBoxDiv.style.backgroundColor = tagColors[item.tag] || 'defaultColor';
        checkBox.checked = item.isComplete;
        checkBox.addEventListener('change', () => {
            todolist[listItemDiv.dataset.index].isComplete = checkBox.checked;
            populateList();
            writeList();
        });


        const listItemContent = document.createElement('div');
        listItemContent.className = 'list-item-content';


        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = item.title;
        title.contentEditable = true;
        title.spellcheck = false;
        title.addEventListener('input', () => {
            todolist[listItemDiv.dataset.index].title = title.textContent; // updates the todo list object attributes on every input recieved!!! SO SIMPLE WOWOW!!!
            writeList();
        });
        title.addEventListener('paste', plaintextPaste);

        const description = document.createElement('span');
        description.className = 'description';
        description.textContent = item.description;
        description.contentEditable = true;
        description.spellcheck = false;
        description.addEventListener('input', () => {
            todolist[listItemDiv.dataset.index].description = description.textContent;
            writeList();
        });
        description.addEventListener('paste', plaintextPaste);

        const listItemTag = document.createElement('span');
        listItemTag.className = 'list-item-tag';
        listItemTag.textContent = item.tag;
        listItemTag.style.backgroundColor = tagColors[item.tag] || 'defaultColor';
        listItemTag.contentEditable = true;
        listItemTag.addEventListener('input', () => {
            todolist[listItemDiv.dataset.index].tag = listItemTag.textContent;
            updateColors();
            populateTabs();
        });
        listItemTag.addEventListener('paste', plaintextPaste);

        const listItemDragger = document.createElement('div');
        listItemDragger.className = 'list-item-drag';
        listItemDragger.textContent = '⋮⋮';


        const listItemDelete = document.createElement('button');
        listItemDelete.className = 'list-item-delete';
        listItemDelete.textContent = '×';
        listItemDelete.addEventListener('click', () => {
            const originalIndex = listItemDiv.dataset.index;
            listItemDiv.remove();
            todolist.splice(originalIndex, 1);
            populateList();
            updateImportance();
            writeList();
        });

        if (item.isComplete) {
            title.classList.add('strikethrough');
            description.classList.add('strikethrough');
        }

        listItemDiv.appendChild(checkBoxDiv);
        checkBoxDiv.appendChild(checkBox);

        listItemDiv.appendChild(listItemDelete)

        listItemDiv.appendChild(listItemContent);
        listItemContent.appendChild(title);
        listItemContent.appendChild(description);
        listItemContent.appendChild(listItemTag);

        listItemDiv.appendChild(listItemDragger)


        container.appendChild(listItemDiv);
    });

    // initializes the 'sortable' package functionality for items within 'container'
    var sortable = Sortable.create(container, {
        animation: 100,
        handle: '.list-item-drag',
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            updateImportance(); // when user stops dragging, importance is updated
            populateList(); // this also updates the tab order somehow... but this is good... but also messes up the animation a little bit...que sera sera...
        }
    });
    populateTabs(); // makes tabs based on existing tags in objects. GIVE US TABSSSSZZZSS!!!
}


// if we are in the ALL tag, text for a new tag will be empty. if not, the tag will automatically be the active one!!
function newItemTagText() {
    if (!activeTab || activeTab.textContent === 'ALL') {
        return '';
    }
    return activeTab.textContent;
}

// creates new template list item, pushes it into the array, and updates the importance then renders the list
function newItem() {
    const item = new ListItem("add a title...", newItemTagText(), "add a description...", "duedate1", (todolist.length + 1), false)
    todolist.push(item);
    updateImportance();
    populateList();
}


// list rendered when DOM is fully loaded! i dont think i need this for an offline app, but just in case...
document.addEventListener('DOMContentLoaded', () => {
    console.log("dom loaded");
    readList();
    populateList();
    populateTabs();
});



// for bug fixing, callable via console to see actual object attributes within the array
function viewList() {
    for (let i = 0; i < todolist.length; i++) {
        console.log(`
            Title: ${todolist[i].title}, 
            Tag: ${todolist[i].tag},
            Description: ${todolist[i].description}, 
            Due Date: ${todolist[i].duedate}, 
            Importance: ${todolist[i].importance},
            isComplete: ${todolist[i].isComplete}
            tagImportance: ${todolist[i].tagImportance}`);
    }
}


// so the user can use the scroll wheel without holding shift to scroll horizontally on the tab bar... strange...
let horizontal = document.getElementById("tabs-bar");
horizontal.addEventListener("wheel", (e)=>{
e.preventDefault();
horizontal.scrollLeft += e.deltaY * 0.4;
})

// for checking if a tab is a duplicate, used in other functions
function isDuplicateTab(tabname) {
    const tabs = document.querySelectorAll('#tabs-bar .tab');
    for (let tab of tabs) {
        if (tab.textContent === tabname) {
            return true;
        }
    }
    return false;
} 


let activeTab = '';


// sets the active tab actually, by removing from the CLASSLIST, the class active (an identifier for the active tab), of the active tab, then giving the identifier to the new active tab!
function setActiveTab(tabElement) {
    if (activeTab) {
        activeTab.classList.remove('active');
    }
    activeTab = tabElement;
    activeTab.classList.add('active');
    populateList();
}

// adds events listener, if there is a click within the tabs bar and it is on a tab, it becomes the active tab and tag!
document.getElementById('tabs-bar').addEventListener('click', function(event) {
    if (event.target.classList.contains('tab')) {
        setActiveTab(event.target);
        activeTag = event.target.textContent;
    }
});

// put up here for structures sake, but really it doest matter too much for functions in js thank god.
var tagColors = {};

// this renders the tab bar! all tab is a constant, then for each item in the todolist it checks for tags. If there is a tag and it is not a duplicate, a new tab is made
// tabs are equipped with an eventlistener to show the 'tab' context menu. Additionally, the if checks to see if the items tag has a color. if it does, it gets this color!
function populateTabs() {
    tabsBar.innerHTML = '';

    const allTab = document.createElement('button');
    allTab.className = 'tab';
    allTab.id = 'ALL-tab';
    allTab.textContent = 'ALL';
    allTab.spellcheck = false;
    allTab.onclick = 'populateList()';
    tabsBar.appendChild(allTab);

    todolist.forEach((item) => {
        if (item.tag && !isDuplicateTab(item.tag)) {
            const newTab = document.createElement('button');
            newTab.className = 'tab';
            newTab.textContent = item.tag;
            newTab.spellcheck = false;
            newTab.addEventListener('contextmenu', showTabMenu);
            if (tagColors[item.tag]) {
                newTab.style.backgroundColor = tagColors[item.tag];
                newTab.style.color = 'black';
            }
            tabsBar.appendChild(newTab);
        }
    });
}



// very important but so small... filters the list by its tags. 
// the passed parameter is a tag name and the filter parameters say we are filtering items, taking ones where their tag matches the one passed through the function
function tagFilteredList(tag) {
    return todolist.filter(item => item.tag === tag);
}


// Function to clear the completed tasks! creates a temporary completeditems array which holds only the completed items
// then compares them with items in the original array. if no index is found, the indexOf function returns a -1, hence the condition down there
// If it finds the completed item in the original array, it splices it from its index! in other words removing it
function clearCompleted() {
    const completedItems = todolist.filter(item => item.isComplete === true);
    completedItems.forEach(item => {
        const index = todolist.indexOf(item);
        if (index > -1) { // js returns -1 if item is not found
            todolist.splice(index, 1);
        }
    });
    populateList();
    writeList();

}


// to be able to interact with the html elements listed below
const tabMenu = document.getElementById('tab-menu');
const colorMenu = document.getElementById('tab-color-menu');
const renameInput = document.getElementById('tab-renamer-input');

// show tab menu on right click within tab bar whilst hiding the color menu if it for some reason is open...
function showTabMenu(event) {
    event.preventDefault();
    selectedTab = event.target;
    colorMenu.style.display = 'none';
    tabMenu.style.display = 'block';
    tabMenu.style.left = `${event.pageX}px`;
    tabMenu.style.top = `${event.pageY}px`; // goes to where the mouse was when right clicked!
}


// event listener, if a click occurs and it is NOT in the tab menu or color menu, both disappear
document.addEventListener('click', (event) => {
    if (!tabMenu.contains(event.target) && !colorMenu.contains(event.target)) {
        tabMenu.style.display = 'none';
        colorMenu.style.display = 'none';
    }
});

// when the escape key is pressed, all stems of the tabmenu disappear
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        tabMenu.style.display = 'none';
        colorMenu.style.display = 'none';
        renameInput.style.display = 'none';
    }
});


// if the change tab color option is selected from the tab menu, the color menu opens at the position of the tab menu, which disappears...
document.getElementById('change-tab-color').addEventListener('click', () => {
    tabMenu.style.display = 'none';
    colorMenu.style.display = 'block';
    colorMenu.style.left = tabMenu.style.left;
    colorMenu.style.top = tabMenu.style.top;
});

// selecting all elements with the color option class, then for each...
// gets an event listener for a click, which changes the color of the selected tab element and updates the tagColor array for continuity!
// e.g. the active tab is homework, therefore this acts as a key for an object, then --> homework = "#ffffff" like this.
document.querySelectorAll('.color-option').forEach(button => {
    button.addEventListener('click', () => {
        const color = button.getAttribute('data-color');
        if (selectedTab) {
            selectedTab.style.backgroundColor = color;
            selectedTab.style.color = 'black';
            const tagToUpdate = selectedTab.textContent;
            tagColors[tagToUpdate] = color;
        }
        colorMenu.style.display = 'none';
        populateList();
    });
});


// an event listener for the reset color option, which gets rid of the html styling, reverting to the css styling... also updates the tag colors array and runs updateColors() for continuity!
document.getElementById('color-reset').addEventListener('click', function() {
    // Get the selected tab
    const selectedTab = document.querySelector('.tab.active');
    if (selectedTab) {
        const tagName = selectedTab.textContent;
        
        // Reset the color of the selected tab
        selectedTab.style.backgroundColor = '';
        selectedTab.style.color = '';

        // Update the tagColors object
        if (tagColors[tagName]) {
            delete tagColors[tagName];
        }

        // Save the updated tagColors to the JSON file
        writeList();

        // Update the UI to reflect the changes
        updateColors();
    }
});

// updates the colors of the list item elements. the 
function updateColors() {
    todolist.forEach((item, index) => { // iteratingggg
        const listItemDiv = document.querySelector(`[data-index="${index}"]`); // each list item html has a data-index attribute, this selects the item with the iterated index
        if (listItemDiv) {
            const checkBoxDiv = listItemDiv.querySelector('.check-box-div');
            const tagField = listItemDiv.querySelector('.list-item-tag');
            if (checkBoxDiv) { // all of these basically mean if the variable is not null, in other words if it was found in the above declarations
                checkBoxDiv.style.backgroundColor = tagColors[item.tag] || '#111111'; // || is or, in this case if there is no object equivalent to item.tag in tagColors it will revert the colors to normal
            }
            if (tagField) {
                tagField.style.backgroundColor = tagColors[item.tag] || '#2e2e2e'; // same here with the || , essentially a try and except
            }
        }
    });
}


// event listener for a click on the rename tab stem
document.getElementById('rename-tab').addEventListener('click', () => {
    if (selectedTab) {
        tabMenu.style.display = 'none';
        renameInput.style.display = 'block';
        renameInput.style.left = tabMenu.style.left;
        renameInput.style.top = tabMenu.style.top;
        renameInput.value = selectedTab.textContent;
        renameInput.focus();
    }
});


// makes enter blur the rename field when pressed
renameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        renameInput.blur();
    }
});

// if the renameinput field loses focus, the contents of the field become the new tab name
renameInput.addEventListener('blur', () => {
    if (selectedTab) {
        const newTabName = renameInput.value;
        const oldTabName = selectedTab.textContent;
        selectedTab.textContent = newTabName;

        // updates the tag of each todolist item with the old tag
        todolist.forEach(item => {
            if (item.tag === oldTabName) {
                item.tag = newTabName;
            }
        });

        // refresh :D
        populateList();
        writeList();
    }
    renameInput.style.display = 'none'; // then the field vanishes :o
});


// when the delete tab and contents option is pressed, that happens! the selected tab and all relevant tabs are deleted
document.getElementById('del-tab').addEventListener('click', () => {
    if (selectedTab) {
        const tagToDelete = selectedTab.textContent;
        selectedTab.remove();

        todolist = todolist.filter(item => item.tag !== tagToDelete); // todolist becomes todolist without the items with this tag

        populateList();
        writeList();
    }
    tabMenu.style.display = 'none'; // poof <3
});


// saves when window is closed!!
window.addEventListener('beforeunload', () => {
    writeList();
});

// bravo, javascript.

/* global fieldProperties, setAnswer, goToNextField, getMetaData, setMetaData */

var choices = fieldProperties.CHOICES
var appearance = fieldProperties.APPEARANCE
var fieldType = fieldProperties.FIELDTYPE
var numChoices = choices.length

var labelContainer = document.querySelector('#label')
var hintContainer = document.querySelector('#hint')

var choiceContainers // Will eventually contain all choice containers, either from no appearance, or 'list-nolabel' appearance
var radioButtonsContainer = document.querySelector('#radio-buttons-container') // default radio buttons
var selectDropDownContainer = document.querySelector('#select-dropdown-container') // minimal appearance
var likertContainer = document.querySelector('#likert-container') // likert
var choiceLabelContainer = document.querySelector('#choice-labels')
var listNoLabelContainer = document.querySelector('#list-nolabel')

var labelOrLnl

if (appearance.indexOf('label') === -1) {
  labelOrLnl = false
} else {
  labelOrLnl = true
}

if (labelOrLnl) {
  choiceContainers = document.querySelectorAll('.fl-radio') // Go through all  the available choices if 'list-nolabel'
} else {
  choiceContainers = document.querySelectorAll('.choice-container') // go through all the available choices
}

if (!labelOrLnl) {
  if (fieldProperties.LABEL) {
    labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
  }
  if (fieldProperties.HINT) {
    hintContainer.innerHTML = unEntity(fieldProperties.HINT)
  }
}

// Prepare the current webview, making adjustments for any appearance options
if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) { // minimal appearance
  removeContainer('minimal')
  selectDropDownContainer.style.display = 'block' // show the select dropdown
} else if (appearance.indexOf('list-nolabel') !== -1) { // list-nolabel appearance
  removeContainer('nolabel')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else if (labelOrLnl) { // If 'label' appearance
  removeContainer('label')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
  removeContainer('likert')
  likertContainer.style.display = 'flex' // show the likert container
  // likert-min appearance
  if (appearance.indexOf('likert-min') !== -1) {
    var likertChoices = document.querySelectorAll('.likert-choice-container')
    for (var i = 1; i < likertChoices.length - 1; i++) {
      likertChoices[i].querySelector('.likert-choice-label').style.display = 'none' // hide all choice labels except the first and last
    }
    likertChoices[0].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-first') // apply a special class to the first choice label
    likertChoices[likertChoices.length - 1].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-last') // apply a special class to the last choice label
  }
} else { // all other appearances
  removeContainer('radio')
  if (fieldProperties.LANGUAGE !== null && isRTL(fieldProperties.LANGUAGE)) {
    radioButtonsContainer.dir = 'rtl'
  }

  // quick appearance
  if ((appearance.indexOf('quick') !== -1) && (fieldType === 'select_one')) {
    for (var i = 0; i < choiceContainers.length; i++) {
      choiceContainers[i].classList.add('appearance-quick') // add the 'appearance-quick' class
      choiceContainers[i].querySelectorAll('.choice-label-text')[0].insertAdjacentHTML('beforeend', '<svg class="quick-appearance-icon"><use xlink:href="#quick-appearance-icon" /></svg>') // insert the 'quick' icon
    }
  }
}

// minimal appearance
if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) {
  selectDropDownContainer.onchange = change // when the select dropdown is changed, call the change() function (which will update the current value)
} else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
  var likertButtons = document.querySelectorAll('div[name="opt"]')
  for (var i = 0; i < likertButtons.length; i++) {
    likertButtons[i].onclick = function () {
      // clear previously selected option (if any)
      var selectedOption = document.querySelector('.likert-input-button.selected')
      if (selectedOption) {
        selectedOption.classList.remove('selected')
      }
      this.classList.add('selected') // mark clicked option as selected
      change.apply({ value: this.getAttribute('data-value') }) // call the change() function and tell it which value was selected
    }
  }
} else { // all other appearances
  var buttons = document.querySelectorAll('input[name="opt"]')
  var numButtons = buttons.length
  if (fieldType === 'select_one') { // Change to radio buttons if select_one
    for (var i = 0; i < numButtons; i++) {
      buttons[i].type = 'radio'
    }
  }
  for (var i = 0; i < numButtons; i++) {
    buttons[i].onchange = function () {
      // remove 'selected' class from a previously selected option (if any)
      var selectedOption = document.querySelector('.choice-container.selected')
      if ((selectedOption) && (fieldType === 'select_one')) {
        selectedOption.classList.remove('selected')
      }
      this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
      change.apply(this) // call the change() function and tell it which value was selected
    }
  }
}

// START link analysis

var allLinkElements = document.getElementsByTagName('a') // All <a> tags, which are analyzed later after everything has been set up, such as unneeded containers being removed
var numLinks = allLinkElements.length // Number of links
var clickTracker = {} // Will be an object tracking number of times each URL has been opened.
var lastMetaData = getMetaData()

if (lastMetaData != null) { // If there were previously clicked links, this gets that data, and puts it into "clickTracker"
  var mdArray = lastMetaData.split('|')
  console.log(mdArray)
  for (var a = 0; a < numLinks; a++) {
    var part = mdArray[a].split(' ')
    clickTracker[part[0]] = parseInt(part[1])
  }
}

// Needs to be here, will only work after un-entity
// Go through each link, and add a listener to add 1 to the number of clicks so far when clicked, tracked in "clickTracker"
for (var a = 0; a < numLinks; a++) {
  var linkElement = allLinkElements[a]
  var linkUrl = linkElement.href
  if (!(linkUrl in clickTracker)) {
    clickTracker[linkUrl] = 0
  }
  allLinkElements[a].onclick = function () {
    var clickedUrl = this.href
    clickTracker[clickedUrl] += 1
    buildMetaData()
  }
}
buildMetaData() // Run here to save metadata in case there is none yet, so not blank if no links are clicked yet

function clearAnswer () {
  // minimal appearance
  if (appearance.indexOf('minimal') !== -1) {
    selectDropDownContainer.value = ''
  } else if (appearance.indexOf('likert') !== -1) { // likert appearance
    var selectedOption = document.querySelector('.likert-input-button.selected')
    if (selectedOption) {
      selectedOption.classList.remove('selected')
    }
  } else { // all other appearances
    for (var b = 0; b < numButtons; b++) {
      var selectedOption = buttons[b]
      selectedOption.checked = false
      selectedOption.parentElement.classList.remove('selected')
    }
  }
  setAnswer('')
}

// Re-build metadata whenever a link is clicked
function buildMetaData () {
  var allMetaData = Object.keys(clickTracker).map(url => url + ' ' + clickTracker[url]).join('|')
  setMetaData(allMetaData)
}

// Removed the containers that are not to be used
function removeContainer (keep) {
  if (keep !== 'radio') {
    radioButtonsContainer.parentElement.removeChild(radioButtonsContainer) // remove the default radio buttons
  }

  if (keep !== 'minimal') {
    selectDropDownContainer.parentElement.removeChild(selectDropDownContainer) // remove the select dropdown contrainer
  }

  if (keep !== 'likert') {
    likertContainer.parentElement.removeChild(likertContainer) // remove the likert container
  }

  if (keep !== 'label') {
    choiceLabelContainer.parentElement.removeChild(choiceLabelContainer)
  }

  if (keep !== 'nolabel') {
    listNoLabelContainer.parentElement.removeChild(listNoLabelContainer)
  }
}

// Save the user's response (update the current answer)
function change () {
  if (fieldType === 'select_one') {
    setAnswer(this.value)
    // If the appearance is 'quick', then also progress to the next field
    if (appearance.indexOf('quick') !== -1) {
      goToNextField()
    }
  } else {
    var selected = []
    for (var c = 0; c < numChoices; c++) {
      if (choiceContainers[c].querySelector('INPUT').checked === true) {
        selected.push(choices[c].CHOICE_VALUE)
      }
    }
    setAnswer(selected.join(' '))
  }
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Detect right-to-left languages
function isRTL (s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF'
  var rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
  var rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']')

  return rtlDirCheck.test(s)
}

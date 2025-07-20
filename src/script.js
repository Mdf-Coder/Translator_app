//////////////////////////////////////////////////////////////////////////////
/////////////////////         App Load Actions             //////////////////
let wordDB = {}

// Load Event
window.addEventListener('DOMContentLoaded', function () {
    setAppThemeFromLocalStorage()
    showHeader()

})

// Update Theme Base On LocalStorage
function setAppThemeFromLocalStorage() {
    if (localStorage.getItem('translate-app-theme')) {
        // Needed Variables
        let [themeName, bgMain, textMain] = localStorage.getItem('translate-app-theme').split(',')
        // Change App Theme
        colorNameSpan.innerHTML = themeName
        document.documentElement.style.setProperty('--bg-main', bgMain)
        document.documentElement.style.setProperty('--text-main', textMain)
    } else {
        // Do Nothing :)
    }
}

// Show Header With Effect
function showHeader() {
    setTimeout(() => {
        document.querySelector('#header-info').classList.remove('hide-header-info')
    }, 1500)
}


////////////////////////////////////////////////////////////////////////////////
//////////////////               Input Event                   ///////////////
let wordInput = document.querySelector('#search-word')
let clearInputBtn = document.querySelector('#clear-input-btn')

wordInput.addEventListener('input', showClearSvg)
clearInputBtn.addEventListener('click', emptyInput)

// Show The Clear Svg If User Entered A Character
function showClearSvg() {
    if (!(wordInput.value.length > 0)) {
        clearInputBtn.classList.add('hide')
    } else {
        clearInputBtn.classList.remove('hide')
    }
}

// Clear Input Value
function emptyInput() {
    wordInput.value = ''
    clearInputBtn.classList.add('hide')
}

////////////////////////////////////////////////////////////////////////////////////
//////////////////       Window KeyDownEvents / Search Btn        //////////////////
let searchBtn = document.querySelector('#search-btn')

window.addEventListener('keydown', windowKeydownHandler)
searchBtn.addEventListener('click', inputValidation)

// If User Clicks On ESC/Enter In Window, Something Happened!
function windowKeydownHandler(event) {
    // Enter KeyCode 13, ESC KeyCode 27
    if ([13, 27].includes(event.keyCode)) {
        switch (event.keyCode) {
            // If ESC Clicked
            case 27 :
                emptyInput()
                break;
            // If Enter Clicked
            case 13 :
                inputValidation()
                break;
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////////
//////////////////               Input Validation               ////////////////////
function inputValidation() {
    // Regex Only Allowed Characters & Not Empty String
    const regexCode = /^\p{L}+$/u;
    const isInputValid = regexCode.test(wordInput.value.trim())
    if (isInputValid) {
        searchForMeaning()
    } else {

    }
}

////////////////////////////////////////////////////////////////////////////////////
//////////////////                 Local Storage                  //////////////////


/////////////////////////////////////////////////////////////////////////////////////
//////////////////           Change App Theme                    ///////////////////
// Open/Close Theme Modal
let openThemeModal = document.querySelector('#open-theme-modal')
let appThemeModal = document.querySelector('#app-theme-modal')
let overlay = document.querySelector('#overlay')
let closeModalXSvg = document.querySelector('#close-theme-modal-x')

// Add EventsListeners
openThemeModal.addEventListener('click', openCloseThemeModalHandler)
overlay.addEventListener('click', openCloseThemeModalHandler)
closeModalXSvg.addEventListener('click', openCloseThemeModalHandler)

// Open / Close Modal
function openCloseThemeModalHandler() {
    appThemeModal.classList.toggle('hide-app-theme-modal')
    overlay.classList.toggle('hide')
}

// Change App Theme
let colorNameSpan = document.querySelector('#color-name')

// Add Event For Each Btn
let changeThemeBtns = document.querySelectorAll('.change-theme-btn')
changeThemeBtns.forEach((btn) => {
    btn.addEventListener('click', changeAppTheme)
})

function changeAppTheme(event) {
    // Needed Variables
    let btn = event.target.className.includes('change-theme-btn') ? event.target : event.target.parentElement
    let bgMain = btn.getAttribute('data-main')
    let textMain = btn.getAttribute('data-text')
    let themeName = btn.firstElementChild.innerHTML
    // Change DOM Color And Values
    colorNameSpan.innerHTML = themeName
    document.documentElement.style.setProperty('--bg-main', bgMain)
    document.documentElement.style.setProperty('--text-main', textMain)
    // Change LocalStorage Theme Value
    localStorage.setItem('translate-app-theme', [themeName, bgMain, textMain])
    // Close Modal
    openCloseThemeModalHandler()
}

//////////////////////////////////////////////////////////////////////////////////////
///////////////                Send API Request For Meaning       ///////////////////
let showResult = document.querySelector('#show-result-page')
let resultHolder = document.querySelector('#result-holder')
let resultLoading = document.querySelector('#result-loading')
let showErrorResult = document.querySelector('#show-result-error')
let searchedWordError = document.querySelector('#searched-word-error')
let closeModalError = document.querySelector('#close-modal-error')
let closeResultModal = document.querySelector('#close-result-modal')

closeResultModal.addEventListener('click', closeResultModalHandler)
closeModalError.addEventListener('click', closeResultModalHandler)

function closeResultModalHandler() {
    showResult.classList.add('hide-animation')
    document.getElementById('search-section').classList.toggle('hide-animation')
    emptyInput()
}

// Send Api and Search for the word Meaning
function searchForMeaning() {
    showResult.classList.remove('hide-animation')
    resultLoading.classList.remove('hidden')
    showErrorResult.classList.add('hidden')
    resultHolder.classList.add('hidden')
    document.getElementById('search-section').classList.toggle('hide-animation')


    let searchedWord = wordInput.value
    let resStatus
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchedWord}`)
        .then(res => {
            resStatus = res.ok
            return res.json()
        })
        .then(data => {
            if (resStatus) {
                resultLoading.classList.add('hidden')
                resultHolder.classList.remove('hidden')
                gettingDataSetVariables(data[0])
            } else {
                resultLoading.classList.add('hidden')
                showErrorResult.classList.remove('hidden')
                searchedWordError.innerHTML = `"${searchedWord.length > 12 ? searchedWord.slice(0, 12) + '...' : searchedWord}"`
            }
        }).catch(() => {
        resultLoading.classList.add('hidden')
        showErrorResult.classList.remove('hidden')
        searchedWordError.innerHTML = `"${searchedWord.length > 12 ? searchedWord.slice(0, 12) + '...' : searchedWord}"`

    })
}

function gettingDataSetVariables(data) {
    // wordInfo = {
    //     word: word,
    //     phonetics: [phonetic_1, phonetic_2],
    //     meanings: [['noun', [definition_1]], ['verb', [definition_1]], ['interjection', [definition_1, definition_2]]],
    //     synonyms: [],
    //     antonyms: [],
    //     wordAudioSrc: src
    // }
    try {
        let wordInfo = {}

        let antonymsList = []
        let synonymsList = []

        // Making Data Easy To Use
        wordInfo['word'] = data.word
        wordInfo['phonetics'] = data.phonetic || ''
        wordInfo['wordAudioSrc'] = ''
        data.phonetics.forEach(item => {
            if (item.audio) {
                wordInfo['wordAudioSrc'] = item.audio
            }
        })

        wordInfo['meanings'] = []
        data.meanings.forEach(item => {
            let obj = []
            let definitions = []
            obj.push(item.partOfSpeech)

            // Get All Definitions
            item.definitions.forEach(mean => {
                definitions.push([mean.definition, mean.example || ''])
            })
            obj.push(definitions)
            wordInfo.meanings.push(obj)

            // Get All Synonyms
            item.synonyms.forEach(syn => {
                synonymsList.push(syn)
            })

            // Get All Antonyms
            item.antonyms.forEach(ant => {
                antonymsList.push(ant)
            })
        })

        wordInfo['antonyms'] = antonymsList
        wordInfo['synonyms'] = synonymsList

        changeDOMContent(wordInfo)
    } catch (err) {
        console.log(err)
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////        Change DOM Content                            ////////////////////
function changeDOMContent(wordData) {
    let word = document.querySelector('#word')
    let partOfSpeech = document.querySelector('#parts-of-speech')
    let audio = document.querySelector('#word-audio')
    let playAudioSvg = document.querySelector('#play-audio')
    let antonymSpan = document.querySelector('#ant')
    let synonymSpan = document.querySelector('#syn')
    let resultMainDiv = document.querySelector('#result-main-div')

    ////// Update input value
    wordInput.value = ''

    ////// Update Header

    // Update Word
    word.innerHTML = wordData.word.length > 12 ? wordData.word.slice(0, 12) + '...' : wordData.word

    // Update Parts Of Speech
    partOfSpeech.innerHTML = ''
    wordData.meanings.forEach(mean => {
        partOfSpeech.insertAdjacentHTML('beforeend', `<span>${mean[0]}</span>`)
    })

    // Set Audio Src
    if (wordData.wordAudioSrc) { // If Audio Available
        let duration
        playAudioSvg.classList.remove('no-audio-found')
        playAudioSvg.classList.add('hover:fill-(--bg-main)/30')
        audio.src = wordData.wordAudioSrc

        // Get Audio Duration
        audio.addEventListener('loadedmetadata', () => {
            duration = audio.duration * 1000;
        })
        // Play Audio Handler
        playAudioSvg.addEventListener('click', function () {
            audio.play()
            setTimeout(() => {
                audio.pause()
                audio.currentTime = 0
            }, duration)
        })
    } else { // If No Audio Available
        audio.src = ''
        playAudioSvg.classList.add('no-audio-found')
        playAudioSvg.classList.remove('hover:fill-(--bg-main)/30')
        playAudioSvg.classList.remove('cursor-pointer')
    }


    ////// Update Main
    resultMainDiv.innerHTML = ''
    wordData.meanings.forEach(mean => {
        resultMainDiv.insertAdjacentHTML("beforeend", `<div class="capitalize p-1 text-(--text-main) font-bold text-base sm:text-lg lg:text-xl 2xl:text-2xl">${mean[0]}:</div>`)
        let newListDOM = document.createElement("ul")
        newListDOM.classList.add("space-y-2", "pl-5", 'pb-3', "text-sm", "sm:text-base", "lg:text-lg", "2xl:text-xl", 'border-b-2', 'border-(--bg-main)', 'border-dashed')
        resultMainDiv.appendChild(newListDOM)
        mean[1].forEach(item => {
            newListDOM.insertAdjacentHTML('beforeend', `<li class="flex flex-col items-start justify-center gap-y-1">
                <span class="text-(--text-main)/70 font-semibold">${item[0]}</span>
            <span class="pl-6 text-xs sm:text-sm lg:text-base 2xl:text-lg text-black/70 font-medium">Example : ${item[1] || 'None'}</span>
                </li>`)
        })
    })


    ////// Update Footer
    // Empty Span
    antonymSpan.innerHTML = ''
    wordData.antonyms.forEach(item => {
        antonymSpan.innerHTML += `${item} ,`
    })
    // Remove Last , From Text
    antonymSpan.innerHTML = antonymSpan.innerHTML.slice(0, -1)

    // Empty Span
    synonymSpan.innerHTML = ''
    wordData.synonyms.forEach(item => {
        synonymSpan.innerHTML += `${item} ,`
    })
    // Remove Last , From Text
    synonymSpan.innerHTML = synonymSpan.innerHTML.slice(0, -1)

}
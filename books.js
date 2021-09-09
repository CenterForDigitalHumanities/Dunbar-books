const SRC = document.querySelector('meta[tei-src]')?.getAttribute("tei-src")
const BOOK = await fetch(SRC)
    .then(res => res.text())
    .then(str => (new window.DOMParser()).parseFromString(str.replaceAll("head>", "header>"), "text/xml"))

const TEI = BOOK.querySelector("body")
const BOOK_ELEMENT = document.body.querySelector("book")
BOOK_ELEMENT.classList.add('container')

const GLOSSARY = await fetch('glossary-min.json')
    .then(res => res.json())
    .then(data => data.results)

BOOK_ELEMENT.innerHTML = TEI.innerHTML


const debounce = (wait, func) => {
    let timeout
    return function f(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

var applyFilter = debounce(200, function (ev) {
    const TERM = ev.target.value.toLowerCase()
    if (TERM?.length < 2) {
        resetClasses(false)
        return
    }
    resetClasses(true)
    const LINES = document.querySelectorAll('[type="poem"] l')
    let results = new Set()
    LINES.forEach(line => {
        if (line.textContent.toLowerCase().includes(TERM)) {
            results.add(line)
                .add(line.closest('div[type="poem"]'))
                .add(line.closest('a').previousElementSibling)
        }
    })
    results.forEach(el => {
        if (!["H2", "DIV"].includes(el.tagName)) {
            el.innerHTML = el.innerHTML.replace(new RegExp("</?mark>", 'g'), ``)
            el.innerHTML = el.innerHTML.replace(new RegExp(TERM, 'gi'), match => `<mark>${match}</mark>`)
        }
        setTimeout(() => el.classList.add('found-term'), 0)
    })
})

function resetClasses(isSearching) {
    document.querySelectorAll('.found-term,.marked').forEach(el => {
        el?.classList.remove('found-term','.marked')
    })
    BOOK_ELEMENT.classList[isSearching ? "add" : "remove"]("filtering")
}

searchFilter.addEventListener('input', applyFilter)

// Glossary Handling
const markupLink = (poem) => {
    if(poem.classList.contains("marked") || !isInViewport(poem)) { return }
    const LINES = poem.querySelectorAll('l')
    GLOSSARY.forEach(entry=>{
        if(!poemContainsTerm(poem,entry.title)) { return }
        poem.classList.add("contains-dialect")
        LINES.forEach(line=>{
            line.innerHTML = line.innerHTML.replace(new RegExp(String.raw`\b${entry.title}\b`, 'gi'), match => `<a href="${entry.url}" data-ipa="${entry.configured_field_t_ipa[0]}" data-definition="${entry.configured_field_t_definition}" data-sound="${entry.download_link}">${match}</a>${glossaryTip(entry)}`)
        })
    })
    poem.classList.add("marked")
}

let glossaryTip = ({title,url,download_link,configured_field_t_definition,configured_field_t_ipa})=>`<div class="glossaryTip">
    <header>${title}</header>
    <p>${configured_field_t_definition}</p>
    <audio controls src="${download_link}">
        <a href="${download_link}" target="_blank">download audio</a>
    </audio>
    <a href="${url}" target="_blank">Visit Glossary</a>
</div>`

const poemContainsTerm = (poem,term)=> (new RegExp(String.raw`\b${term}\b`, 'i')).test(poem.textContent)

//If you just wanted to check whether there was an instance of dialect or not, knowing all the queues.
const poemContainsDialect = (poem, DIALECTQUEUES=GLOSSARY) => (new RegExp(DIALECTQUEUES.map(function(q){ return '\\b'+q+'\\b' }).join('|'),'g')).test(poem.textContent)

document.addEventListener('scroll',()=>document.querySelectorAll('[type="poem"]').forEach(markupLink))

function isInViewport(element) {
    const rect = element.getBoundingClientRect()
    const height = (window.innerHeight || document.documentElement.clientHeight)
    return (
        rect.top <=0 && rect.bottom >= height // around the screen
        || rect.top >= 0 && rect.top <= height // entering screen
        || rect.bottom >= 0 && rect.bottom <= height // leaving the screen
    )
}

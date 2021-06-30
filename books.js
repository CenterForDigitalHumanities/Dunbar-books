const SRC = document.querySelector('meta[tei-src]')?.getAttribute("tei-src")
const BOOK = await fetch(SRC)
    .then(res => res.text())
    .then(str => (new window.DOMParser()).parseFromString(str.replaceAll("head>", "header>"), "text/xml"))

const TEI = BOOK.querySelector("body")
const BOOK_ELEMENT = document.body.querySelector("book")
BOOK_ELEMENT.classList.add('container')

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
    document.querySelectorAll('.found-term').forEach(el => {
        el?.classList.remove('found-term')
    })
    BOOK_ELEMENT.classList[isSearching ? "add" : "remove"]("filtering")
}

searchFilter.addEventListener('input', applyFilter)

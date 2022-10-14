import { PAIRS, VARI } from './data.js'

// https://github.com/alcor/emoji-supply
const emojiUrl = (codePoint) => {
    let cp = codePoint.split("-").filter(x => x !== "fe0f").join("_");
    return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u${cp}.png`;
}

const toEomjiKitchen = (r, c) => {
    c[0] = c[0].split(/-/g).join("-u");
    c[1] = c[1].split(/-/g).join("-u");
    /* return `https://www.gstatic.com/android/keyboard/emojikitchen/${r}/u${c[0]}/u${c[0]}_u${c[1]}.png` */
    return `${r}/u${c[0]}/u${c[0]}_u${c[1]}.webp`
}

// https://stackoverflow.com/a/71619350
function splitEmoji(string) {
    return [...new Intl.Segmenter().segment(string)].map(x => x.segment)
}

// https://github.com/IonicaBizau/emoji-unicode
function emojiUnicode(input) {
    return emojiUnicode.raw(input).split(' ').map(val => parseInt(val).toString(16)).join('-')
}
emojiUnicode.raw = function (input) {
    if (input.length === 1) {
        return input.charCodeAt(0).toString();
    }
    else if (input.length > 1) {
        const pairs = [];
        for (var i = 0; i < input.length; i++) {
            if (
                // high surrogate
                input.charCodeAt(i) >= 0xd800 && input.charCodeAt(i) <= 0xdbff
            ) {
                if (
                    input.charCodeAt(i + 1) >= 0xdc00 && input.charCodeAt(i + 1) <= 0xdfff
                ) {
                    // low surrogate
                    pairs.push(
                        (input.charCodeAt(i) - 0xd800) * 0x400
                        + (input.charCodeAt(i + 1) - 0xdc00) + 0x10000
                    );
                }
            } else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
                // modifiers and joiners
                pairs.push(input.charCodeAt(i))
            }
        }
        return pairs.join(' ');
    }
    return '';
};

// http://unicode.org/emoji/charts/emoji-variants.html
function getVariant(eu) {
    return VARI.indexOf(eu) > -1 ? eu + '-fe0f' : eu;
}

export default function ekquery(str = '❤️‍🩹🌶️') {
    let [e1, e2] = splitEmoji(str);
    e1 = getVariant(emojiUnicode(e1));
    e2 = getVariant(emojiUnicode(e2));
    const re = new RegExp("^.*" + e1 + ".*$", "gm");
    const array = [...PAIRS.matchAll(re)];
    for (let i of array) {
        let [d, c1, c2] = i.pop().split("/");
        if (c1 == e1 && c2 == e2 || c1 == e2 && c2 == e1) {
            return toEomjiKitchen(parseInt(d, 16) + 20200000, [c1, c2])
        }
    }
    return ''
}
// 1. Palindrome Checker
function isPalindrome(str) {
    const cleanedStr = str.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters
    const reversedStr = cleanedStr.split('').reverse().join('');
    return cleanedStr === reversedStr;
}

function findUniqueValues(arr) {
    return [...new Set(arr)];
}

function countDuplicates(arr) {
    const counts = {};
    arr.forEach(item => {
        if (!counts[item]) {
            counts[item] = 1;
        } else {
            counts[item]++;
        }
    });

    const duplicates = {};
    for (const item in counts) {
        if (counts[item] > 1) {
            duplicates[item] = counts[item];
        }
    }
    return duplicates;
}


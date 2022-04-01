
const waitForAnySelector = (page, selectors) => new Promise((resolve, reject) => {
    let hasFound = false
    selectors.forEach(selector => {
        page.waitFor(selector)
            .then(() => {
                if (!hasFound) {
                    hasFound = true
                    resolve(selector)
                }
            })
            .catch((error) => {
                reject(error);
                // console.log('Error while looking up selector ' + selector, error.message)
            })
    })
});

export default {
    waitForAnySelector
};
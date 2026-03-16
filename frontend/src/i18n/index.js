import zhTW from './zh-TW';
import en from './en';

export const translations = {
    'zh-TW': zhTW,
    'en': en,
};

export const languageOptions = [
    { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
];

export const defaultLanguage = 'zh-TW';

/**
 * 根據路徑從翻譯物件中取得翻譯文字
 * @param {object} translations - 翻譯物件
 * @param {string} path - 翻譯路徑，例如 'common.save'
 * @param {object} params - 替換參數，例如 { count: 5 }
 * @returns {string} 翻譯後的文字
 */
export const getTranslation = (translations, path, params = {}) => {
    const keys = path.split('.');
    let result = translations;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            console.warn(`Translation not found for path: ${path}`);
            return path; // 返回路徑作為 fallback
        }
    }

    if (typeof result !== 'string') {
        console.warn(`Translation at path "${path}" is not a string`);
        return path;
    }

    // 替換參數，例如 {count} -> 5
    return result.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
    });
};
